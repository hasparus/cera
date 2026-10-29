import React, { useMemo, useReducer } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, ScrollView } from "tamagui";
import { useRouter } from "expo-router";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  getDay,
} from "date-fns";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Check,
} from "lucide-react-native";

import { useRoutine } from "@/context/routine";
import { useCosmetics } from "@/context/cosmetics";
import { useTheme } from "@/context/theme";
import { useIntl } from "@/context/intl";

const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

export default function CalendarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, formatDate } = useIntl();
  const { routineHistory } = useRoutine();
  const { products } = useCosmetics();
  const insets = useSafeAreaInsets();

  const [currentMonth, shiftMonth] = useReducer(
    (month: Date, by: number) => addMonths(month, by),
    undefined,
    () => new Date(),
  );
  const [selectedDate, selectDate] = useReducer(
    (_: Date | null, date: Date) => date,
    null,
  );

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    const startDay = getDay(start);
    const emptyDays = Array(startDay).fill(null);

    return [...emptyDays, ...days];
  }, [currentMonth]);

  const getDateUsage = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dayHistory = routineHistory[dateKey];

    if (!dayHistory) return null;

    const morningCount = dayHistory.morning?.length || 0;
    const eveningCount = dayHistory.evening?.length || 0;

    return {
      morning: morningCount,
      evening: eveningCount,
      total: morningCount + eveningCount,
    };
  };

  const getProductName = (id: string) => {
    const product = products.find((p) => p.id === id);
    return product ? `${product.brand} - ${product.name}` : t("unknownProduct");
  };

  const selectedDateUsage = useMemo(() => {
    if (!selectedDate) return null;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const dayHistory = routineHistory[dateKey];

    if (!dayHistory) return null;

    return {
      morning: dayHistory.morning || [],
      evening: dayHistory.evening || [],
    };
  }, [selectedDate, routineHistory]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={20}
        paddingTop={Math.max(insets.top, 12) + 8}
        paddingBottom={15}
        borderBottomWidth={1}
        borderBottomColor={colors.border}
      >
        <YStack padding={8} marginLeft={-8} onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </YStack>
        <Text fontSize={18} fontWeight="600" color={colors.text}>
          {t("calendar.title")}
        </Text>
        <YStack width={40} />
      </XStack>

      <ScrollView flex={1} contentContainerStyle={{ padding: 20 }}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          marginBottom={20}
        >
          <YStack
            padding={10}
            borderRadius={12}
            backgroundColor={colors.card}
            onPress={() => shiftMonth(-1)}
          >
            <ChevronLeft size={20} color={colors.text} />
          </YStack>

          <Text fontSize={20} fontWeight="600" color={colors.text}>
            {formatDate(currentMonth, "monthYear")}
          </Text>

          <YStack
            padding={10}
            borderRadius={12}
            backgroundColor={colors.card}
            onPress={() => shiftMonth(1)}
          >
            <ChevronRight size={20} color={colors.text} />
          </YStack>
        </XStack>

        <XStack marginBottom={10}>
          {WEEKDAY_INDEXES.map((dayIndex) => (
            <YStack
              key={dayIndex}
              flex={1}
              alignItems="center"
              paddingVertical={8}
            >
              <Text fontSize={12} fontWeight="600" color={colors.subtext}>
                {formatDate(new Date(2020, 5, 7 + dayIndex), "weekdayShort")}
              </Text>
            </YStack>
          ))}
        </XStack>

        <YStack flexDirection="row" flexWrap="wrap">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <YStack key={`empty-${index}`} width="14.28%" aspectRatio={1} />
              );
            }

            const usage = getDateUsage(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <YStack
                key={day.toISOString()}
                width="14.28%"
                aspectRatio={1}
                padding={2}
              >
                <YStack
                  flex={1}
                  borderRadius={12}
                  justifyContent="center"
                  alignItems="center"
                  backgroundColor={
                    isSelected
                      ? colors.tint
                      : isToday
                        ? colors.card
                        : "transparent"
                  }
                  borderWidth={isToday && !isSelected ? 1 : 0}
                  borderColor={colors.tint}
                  onPress={() => selectDate(day)}
                >
                  <Text
                    fontSize={14}
                    fontWeight={isToday || isSelected ? "600" : "400"}
                    color={isSelected ? "#FFF" : colors.text}
                  >
                    {format(day, "d")}
                  </Text>

                  {usage && usage.total > 0 && (
                    <XStack marginTop={2} gap={2}>
                      {usage.morning > 0 && (
                        <YStack
                          width={6}
                          height={6}
                          borderRadius={3}
                          backgroundColor={
                            isSelected ? "rgba(255,255,255,0.7)" : "#FFA726"
                          }
                        />
                      )}
                      {usage.evening > 0 && (
                        <YStack
                          width={6}
                          height={6}
                          borderRadius={3}
                          backgroundColor={
                            isSelected ? "rgba(255,255,255,0.7)" : "#5C6BC0"
                          }
                        />
                      )}
                    </XStack>
                  )}
                </YStack>
              </YStack>
            );
          })}
        </YStack>

        <XStack marginTop={16} justifyContent="center" gap={20}>
          <XStack alignItems="center" gap={6}>
            <YStack
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor="#FFA726"
            />
            <Text fontSize={12} color={colors.subtext}>
              {t("time.morning")}
            </Text>
          </XStack>
          <XStack alignItems="center" gap={6}>
            <YStack
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor="#5C6BC0"
            />
            <Text fontSize={12} color={colors.subtext}>
              {t("time.evening")}
            </Text>
          </XStack>
        </XStack>

        {selectedDate && selectedDateUsage && (
          <YStack marginTop={24}>
            <Text
              fontSize={16}
              fontWeight="600"
              marginBottom={12}
              color={colors.text}
            >
              {formatDate(selectedDate, "longDayMonth")}
            </Text>

            {selectedDateUsage.morning.length > 0 && (
              <YStack marginBottom={16}>
                <XStack alignItems="center" marginBottom={8} gap={6}>
                  <Sun size={16} color="#FFA726" />
                  <Text fontSize={14} fontWeight="600" color={colors.text}>
                    {t("time.morning")}
                  </Text>
                </XStack>
                {selectedDateUsage.morning.map((productId, index) => (
                  <XStack
                    key={productId}
                    padding={12}
                    borderRadius={12}
                    marginBottom={
                      index < selectedDateUsage.morning.length - 1 ? 8 : 0
                    }
                    alignItems="center"
                    backgroundColor={colors.card}
                  >
                    <Check size={16} color={colors.success} />
                    <Text
                      fontSize={14}
                      marginLeft={8}
                      flex={1}
                      color={colors.text}
                    >
                      {getProductName(productId)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}

            {selectedDateUsage.evening.length > 0 && (
              <YStack>
                <XStack alignItems="center" marginBottom={8} gap={6}>
                  <Moon size={16} color="#5C6BC0" />
                  <Text fontSize={14} fontWeight="600" color={colors.text}>
                    {t("time.evening")}
                  </Text>
                </XStack>
                {selectedDateUsage.evening.map((productId, index) => (
                  <XStack
                    key={productId}
                    padding={12}
                    borderRadius={12}
                    marginBottom={
                      index < selectedDateUsage.evening.length - 1 ? 8 : 0
                    }
                    alignItems="center"
                    backgroundColor={colors.card}
                  >
                    <Check size={16} color={colors.success} />
                    <Text
                      fontSize={14}
                      marginLeft={8}
                      flex={1}
                      color={colors.text}
                    >
                      {getProductName(productId)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}

            {selectedDateUsage.morning.length === 0 &&
              selectedDateUsage.evening.length === 0 && (
                <Text fontSize={14} textAlign="center" color={colors.subtext}>
                  {t("calendar.noProductsUsed")}
                </Text>
              )}
          </YStack>
        )}

        {selectedDate && !selectedDateUsage && (
          <YStack marginTop={24} alignItems="center">
            <Text fontSize={14} color={colors.subtext}>
              {t("calendar.noRoutineData", {
                date: formatDate(selectedDate, "dayMonth"),
              })}
            </Text>
          </YStack>
        )}

        <YStack height={40} />
      </ScrollView>
    </View>
  );
}
