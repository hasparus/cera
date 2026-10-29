import React, { useMemo, useReducer } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack, XStack, Text } from "tamagui";
import { useCosmetics, Product } from "@/context/cosmetics";
import { useTheme } from "@/context/theme";
import { useIntl } from "@/context/intl";
import { PageTitleBar } from "@/components/PageTitleBar";
import {
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { addMonths, differenceInDays, parseISO } from "date-fns";
import { Image } from "expo-image";
import {
  detectConflicts,
  detectIngredients,
  type DetectedConflict,
} from "@/constants/ingredients";

export default function ShelfScreen() {
  const { products, removeProduct } = useCosmetics();
  const router = useRouter();
  const { colors, showDetailedConflicts } = useTheme();
  const { t } = useIntl();
  const [expandedConflict, toggleConflict] = useReducer(
    (expanded: number | null, index: number) =>
      expanded === index ? null : index,
    null,
  );
  const [showAllConflicts, toggleShowAllConflicts] = useReducer(
    (show: boolean) => !show,
    false,
  );

  const conflicts = useMemo(() => detectConflicts(products), [products]);
  const highSeverityCount = useMemo(
    () => conflicts.filter((c) => c.severity === "high").length,
    [conflicts],
  );

  const visibleConflicts = showAllConflicts ? conflicts : conflicts.slice(0, 3);

  const getExpirationStatus = (product: Product) => {
    if (!product.openedAt || !product.periodAfterOpening) return null;

    const openedDate = parseISO(product.openedAt);
    const expirationDate = addMonths(openedDate, product.periodAfterOpening);
    const daysLeft = differenceInDays(expirationDate, new Date());

    if (daysLeft < 0)
      return {
        status: "expired" as const,
        label: t("shelf.expired", { count: Math.abs(daysLeft) }),
        color: colors.error,
      };
    if (daysLeft <= 30)
      return {
        status: "warning" as const,
        label: t("shelf.daysLeft", { count: daysLeft }),
        color: "#F59E0B",
      };
    return {
      status: "good" as const,
      label: t("shelf.daysLeft", { count: daysLeft }),
      color: colors.success,
    };
  };

  const getProductIngredientTags = (product: Product) => {
    return detectIngredients(product.name);
  };

  const renderConflictCard = (conflict: DetectedConflict, index: number) => {
    const isExpanded = expandedConflict === index;
    const isHigh = conflict.severity === "high";

    return (
      <YStack
        key={`${conflict.productA.id}-${conflict.productB.id}-${index}`}
        borderRadius={16}
        marginBottom={8}
        overflow="hidden"
        backgroundColor={isHigh ? colors.error + "10" : "#F59E0B12"}
        borderWidth={1}
        borderColor={isHigh ? colors.error + "25" : "#F59E0B25"}
      >
        <XStack
          padding={14}
          alignItems="center"
          onPress={() =>
            showDetailedConflicts ? toggleConflict(index) : undefined
          }
        >
          <YStack
            width={32}
            height={32}
            borderRadius={10}
            justifyContent="center"
            alignItems="center"
            marginRight={12}
            backgroundColor={isHigh ? colors.error + "20" : "#F59E0B20"}
          >
            <AlertTriangle
              size={16}
              color={isHigh ? colors.error : "#F59E0B"}
            />
          </YStack>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="600" color={colors.text}>
              {conflict.shortWarning}
            </Text>
            <Text fontSize={12} color={colors.subtext} marginTop={2}>
              {conflict.productA.brand} · {conflict.productA.name}
            </Text>
            <Text fontSize={12} color={colors.subtext}>
              {conflict.productB.brand} · {conflict.productB.name}
            </Text>
          </YStack>
          {showDetailedConflicts && (
            <YStack padding={4}>
              {isExpanded ? (
                <ChevronUp size={16} color={colors.subtext} />
              ) : (
                <ChevronDown size={16} color={colors.subtext} />
              )}
            </YStack>
          )}
        </XStack>

        {showDetailedConflicts && isExpanded && (
          <YStack paddingHorizontal={14} paddingBottom={14} paddingTop={0}>
            <YStack
              padding={12}
              borderRadius={12}
              backgroundColor={colors.card}
            >
              <Text fontSize={13} lineHeight={20} color={colors.text}>
                {conflict.reason}
              </Text>
            </YStack>
          </YStack>
        )}
      </YStack>
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const expiration = getExpirationStatus(item);
    const ingredientTags = getProductIngredientTags(item);

    return (
      <XStack
        alignItems="center"
        justifyContent="space-between"
        borderRadius={20}
        padding={16}
        marginBottom={12}
        backgroundColor={colors.card}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.05}
        shadowRadius={8}
        elevation={2}
      >
        <XStack alignItems="center" flex={1}>
          <YStack
            width={56}
            height={56}
            borderRadius={16}
            justifyContent="center"
            alignItems="center"
            marginRight={16}
            overflow="hidden"
            backgroundColor={colors.border}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text
                fontSize={18}
                fontWeight="600"
                textTransform="uppercase"
                color={colors.subtext}
              >
                {item.brand.substring(0, 1)}
                {item.name.substring(0, 1)}
              </Text>
            )}
          </YStack>
          <YStack flex={1}>
            <Text
              fontSize={11}
              fontWeight="600"
              marginBottom={2}
              textTransform="uppercase"
              letterSpacing={0.5}
              color={colors.tint}
            >
              {item.brand}
            </Text>
            <Text
              fontSize={15}
              fontWeight="600"
              marginBottom={4}
              color={colors.text}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {ingredientTags.length > 0 && (
              <XStack flexWrap="wrap" gap={4} marginBottom={4}>
                {ingredientTags.slice(0, 3).map((tag) => (
                  <YStack
                    key={tag}
                    paddingHorizontal={8}
                    paddingVertical={2}
                    borderRadius={8}
                    backgroundColor={colors.tint + "15"}
                  >
                    <Text fontSize={10} fontWeight="600" color={colors.tint}>
                      {tag}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            )}

            {expiration ? (
              <XStack alignItems="center">
                <YStack marginRight={4}>
                  {expiration.status === "expired" ? (
                    <AlertCircle size={13} color={expiration.color} />
                  ) : (
                    <Clock size={13} color={expiration.color} />
                  )}
                </YStack>
                <Text fontSize={12} fontWeight="500" color={expiration.color}>
                  {expiration.label}
                </Text>
              </XStack>
            ) : (
              <Text fontSize={12} color={colors.subtext}>
                {t("shelf.notOpened")}
              </Text>
            )}
          </YStack>
        </XStack>

        <YStack
          padding={8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => removeProduct(item.id)}
        >
          <Trash2 size={20} color={colors.subtext} />
        </YStack>
      </XStack>
    );
  };

  const ConflictBanner = () => {
    if (conflicts.length === 0) return null;

    return (
      <YStack paddingHorizontal={20} paddingTop={4} paddingBottom={8}>
        <YStack
          borderRadius={20}
          padding={16}
          backgroundColor={
            highSeverityCount > 0 ? colors.error + "08" : "#F59E0B08"
          }
          borderWidth={1}
          borderColor={
            highSeverityCount > 0 ? colors.error + "20" : "#F59E0B20"
          }
        >
          <XStack alignItems="center" marginBottom={12}>
            <YStack
              width={36}
              height={36}
              borderRadius={12}
              justifyContent="center"
              alignItems="center"
              marginRight={12}
              backgroundColor={
                highSeverityCount > 0 ? colors.error + "18" : "#F59E0B18"
              }
            >
              <ShieldAlert
                size={20}
                color={highSeverityCount > 0 ? colors.error : "#F59E0B"}
              />
            </YStack>
            <YStack flex={1}>
              <Text fontSize={15} fontWeight="700" color={colors.text}>
                {t("ingredients.conflictsDetected", {
                  count: conflicts.length,
                })}
              </Text>
              <Text fontSize={12} color={colors.subtext}>
                {highSeverityCount > 0
                  ? t("ingredients.highSeverity", { count: highSeverityCount })
                  : t("ingredients.reviewCombinations")}
              </Text>
            </YStack>
          </XStack>

          {visibleConflicts.map((conflict, index) =>
            renderConflictCard(conflict, index),
          )}

          {conflicts.length > 3 && (
            <YStack
              alignItems="center"
              paddingTop={8}
              onPress={toggleShowAllConflicts}
            >
              <Text fontSize={13} fontWeight="600" color={colors.tint}>
                {showAllConflicts
                  ? t("ingredients.showLess")
                  : t("ingredients.showMore", { count: conflicts.length - 3 })}
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    );
  };

  const NoConflictsBadge = () => {
    if (products.length < 2 || conflicts.length > 0) return null;

    return (
      <YStack paddingHorizontal={20} paddingTop={4} paddingBottom={8}>
        <XStack
          borderRadius={16}
          padding={14}
          alignItems="center"
          backgroundColor={colors.success + "10"}
          borderWidth={1}
          borderColor={colors.success + "20"}
        >
          <YStack
            width={32}
            height={32}
            borderRadius={10}
            justifyContent="center"
            alignItems="center"
            marginRight={12}
            backgroundColor={colors.success + "20"}
          >
            <Zap size={16} color={colors.success} />
          </YStack>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="600" color={colors.success}>
              {t("ingredients.compatibleTitle")}
            </Text>
            <Text fontSize={12} color={colors.subtext}>
              {t("ingredients.compatibleBody")}
            </Text>
          </YStack>
        </XStack>
      </YStack>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <PageTitleBar
        title={t("shelf.title")}
        rightElement={
          <YStack
            width={40}
            height={40}
            borderRadius={20}
            justifyContent="center"
            alignItems="center"
            backgroundColor={colors.tint}
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.3}
            shadowRadius={8}
            elevation={4}
            onPress={() => router.push("/add-product")}
          >
            <Plus size={24} color="#FFF" />
          </YStack>
        }
      />

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 20,
        }}
        ListHeaderComponent={
          <>
            <ConflictBanner />
            <NoConflictsBadge />
          </>
        }
        ListEmptyComponent={
          <YStack alignItems="center" justifyContent="center" paddingTop={60}>
            <Text
              fontSize={18}
              fontWeight="600"
              marginBottom={8}
              color={colors.text}
            >
              {t("shelf.emptyTitle")}
            </Text>
            <Text
              fontSize={14}
              textAlign="center"
              marginBottom={24}
              paddingHorizontal={40}
              lineHeight={20}
              color={colors.subtext}
            >
              {t("shelf.emptyBody")}
            </Text>
            <YStack
              paddingHorizontal={24}
              paddingVertical={14}
              borderRadius={24}
              backgroundColor={colors.tint}
              onPress={() => router.push("/add-product")}
            >
              <Text color="#FFFFFF" fontWeight="600" fontSize={16}>
                {t("shelf.addFirst")}
              </Text>
            </YStack>
          </YStack>
        }
      />
    </SafeAreaView>
  );
}
