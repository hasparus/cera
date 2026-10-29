import React, { useMemo, useReducer } from "react";
import { ScrollView as RNScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, XStack, Text, ScrollView } from "tamagui";
import {
  format,
  addDays,
  isSameDay,
  subDays,
  differenceInDays,
} from "date-fns";
import { Check, Sun, Moon, CalendarDays } from "lucide-react-native";
import { useRouter } from "expo-router";

import { useRoutine, TimeOfDay } from "@/context/routine";
import { useCosmetics } from "@/context/cosmetics";
import { useTheme } from "@/context/theme";
import { useIntl } from "@/context/intl";
import { PageTitleBar } from "@/components/PageTitleBar";

export default function RoutineScreen() {
  const [selectedDate, selectDate] = useReducer(
    (_: Date, date: Date) => date,
    undefined,
    () => new Date(),
  );
  const { routineConfig, routineHistory, toggleCompletion } = useRoutine();
  const { products } = useCosmetics();
  const { colors } = useTheme();
  const { t, formatDate } = useIntl();
  const router = useRouter();

  const calendarDays = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 7);
    return Array.from({ length: 14 }).map((_, i) => addDays(start, i));
  }, []);

  const getProductDetails = (id: string) => products.find((p) => p.id === id);

  const getVisibleProducts = (productIds: string[]) => {
    return productIds.filter((id) => {
      const product = getProductDetails(id);
      if (!product) return false;

      if (!product.frequency || product.frequency.type === "daily") return true;

      if (product.frequency.type === "weekly") {
        const currentDay = selectedDate.getDay();
        return product.frequency.daysOfWeek.includes(currentDay);
      }

      if (product.frequency.type === "interval") {
        const startDate = product.openedAt
          ? new Date(product.openedAt)
          : new Date();
        const diff = differenceInDays(selectedDate, startDate);

        if (diff < 0) return false;

        return diff % product.frequency.days === 0;
      }

      return true;
    });
  };

  const isCompleted = (productId: string, timeOfDay: TimeOfDay) => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dayHistory = routineHistory[dateKey];
    return dayHistory?.[timeOfDay]?.includes(productId) ?? false;
  };

  const handleToggle = (productId: string, timeOfDay: TimeOfDay) => {
    toggleCompletion({
      date: format(selectedDate, "yyyy-MM-dd"),
      timeOfDay,
      productId,
    });
  };

  const renderRoutineSection = (
    title: string,
    icon: React.ReactNode,
    productIds: string[],
    timeOfDay: TimeOfDay,
  ) => {
    const visibleProductIds = getVisibleProducts(productIds);
    if (visibleProductIds.length === 0) return null;

    return (
      <YStack marginBottom={30}>
        <XStack alignItems="center" marginBottom={15}>
          <YStack marginRight={8}>{icon}</YStack>
          <Text fontSize={18} fontWeight="600" color={colors.text}>
            {title}
          </Text>
        </XStack>
        <YStack>
          {visibleProductIds.map((id, index) => {
            const product = getProductDetails(id);
            if (!product) return null;
            const completed = isCompleted(id, timeOfDay);
            const isLast = index === visibleProductIds.length - 1;

            return (
              <YStack key={id} marginBottom={isLast ? 0 : 12}>
                <XStack
                  borderRadius={16}
                  padding={16}
                  alignItems="center"
                  justifyContent="space-between"
                  borderWidth={1}
                  borderColor="transparent"
                  backgroundColor={completed ? colors.background : colors.card}
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={completed ? 0 : 0.05}
                  shadowRadius={8}
                  elevation={completed ? 0 : 2}
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => handleToggle(id, timeOfDay)}
                >
                  <YStack flex={1}>
                    <Text
                      fontSize={12}
                      fontWeight="600"
                      marginBottom={2}
                      textTransform="uppercase"
                      letterSpacing={0.5}
                      color={colors.tint}
                      opacity={completed ? 0.5 : 1}
                      textDecorationLine={completed ? "line-through" : "none"}
                    >
                      {product.brand}
                    </Text>
                    <Text
                      fontSize={16}
                      fontWeight="500"
                      color={colors.text}
                      opacity={completed ? 0.5 : 1}
                      textDecorationLine={completed ? "line-through" : "none"}
                    >
                      {product.name}
                    </Text>
                  </YStack>
                  <YStack
                    width={24}
                    height={24}
                    borderRadius={12}
                    borderWidth={2}
                    justifyContent="center"
                    alignItems="center"
                    borderColor={completed ? colors.tint : colors.border}
                    backgroundColor={completed ? colors.tint : "transparent"}
                  >
                    {completed && (
                      <Check size={14} color="#FFF" strokeWidth={3} />
                    )}
                  </YStack>
                </XStack>
              </YStack>
            );
          })}
        </YStack>
      </YStack>
    );
  };

  const isEmpty =
    routineConfig.morning.length === 0 && routineConfig.evening.length === 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <PageTitleBar
        title={t("routine.title")}
        rightElement={
          <YStack
            width={40}
            height={40}
            borderRadius={20}
            justifyContent="center"
            alignItems="center"
            backgroundColor={colors.card}
            onPress={() => router.push("/calendar")}
          >
            <CalendarDays size={20} color={colors.tint} />
          </YStack>
        }
      />

      <YStack marginBottom={10}>
        <RNScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15 }}
        >
          {calendarDays.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <YStack
                key={date.toISOString()}
                width={50}
                height={70}
                justifyContent="center"
                alignItems="center"
                marginHorizontal={5}
                borderRadius={16}
                backgroundColor={isSelected ? colors.tint : "transparent"}
                onPress={() => selectDate(date)}
              >
                <Text
                  fontSize={12}
                  marginBottom={4}
                  fontWeight="500"
                  textTransform="uppercase"
                  color={isSelected ? "#FFFFFF" : colors.subtext}
                >
                  {formatDate(date, "weekdayShort")}
                </Text>
                <YStack
                  width={32}
                  height={32}
                  justifyContent="center"
                  alignItems="center"
                  borderRadius={16}
                  backgroundColor={
                    isToday && !isSelected ? colors.border : "transparent"
                  }
                >
                  <Text
                    fontSize={16}
                    fontWeight="600"
                    color={isSelected ? "#FFFFFF" : colors.text}
                  >
                    {format(date, "d")}
                  </Text>
                </YStack>
              </YStack>
            );
          })}
        </RNScrollView>
      </YStack>

      <ScrollView
        flex={1}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 10,
          paddingBottom: 40,
        }}
      >
        {isEmpty ? (
          <YStack alignItems="center" justifyContent="center" paddingTop={60}>
            <Text
              fontSize={18}
              fontWeight="600"
              marginBottom={8}
              color={colors.text}
            >
              {t("routine.emptyTitle")}
            </Text>
            <Text
              fontSize={14}
              textAlign="center"
              marginBottom={24}
              paddingHorizontal={40}
              color={colors.subtext}
            >
              {t("routine.emptyBody")}
            </Text>
            <YStack
              paddingHorizontal={24}
              paddingVertical={12}
              borderRadius={24}
              backgroundColor={colors.tint}
              onPress={() => router.push("/(tabs)/shelf")}
            >
              <Text color="#FFFFFF" fontWeight="600" fontSize={16}>
                {t("routine.goToShelf")}
              </Text>
            </YStack>
          </YStack>
        ) : (
          <>
            {renderRoutineSection(
              t("routine.morning"),
              <Sun size={20} color={colors.tint} />,
              routineConfig.morning,
              "morning",
            )}
            {renderRoutineSection(
              t("routine.evening"),
              <Moon size={20} color={colors.text} />,
              routineConfig.evening,
              "evening",
            )}

            {(routineConfig.morning.length > 0 ||
              routineConfig.evening.length > 0) && (
              <YStack marginTop={20} alignItems="center">
                <Text fontSize={13} color={colors.subtext}>
                  {formatDate(selectedDate, "longDayMonth")}
                </Text>
              </YStack>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
