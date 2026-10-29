import React, { useMemo, useReducer } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Input, ScrollView } from "tamagui";
import { useTheme } from "@/context/theme";
import { useIntl } from "@/context/intl";
import { useCosmetics, Frequency } from "@/context/cosmetics";
import { useRoutine, TimeOfDay } from "@/context/routine";
import { useRouter } from "expo-router";
import {
  X,
  Check,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Infinity as InfinityIcon,
} from "lucide-react-native";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  isSameDay,
  isAfter,
} from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

const MOCK_SUGGESTIONS = [
  { brand: "The Ordinary", name: "Niacinamide 10% + Zinc 1%" },
  { brand: "The Ordinary", name: "Hyaluronic Acid 2% + B5" },
  { brand: "CeraVe", name: "Hydrating Cleanser" },
  { brand: "CeraVe", name: "Moisturizing Cream" },
  { brand: "La Roche-Posay", name: "Anthelios UV Mune 400" },
  { brand: "La Roche-Posay", name: "Cicaplast Baume B5" },
  { brand: "Paula's Choice", name: "Skin Perfecting 2% BHA Liquid Exfoliant" },
  { brand: "Cosrx", name: "Advanced Snail 96 Mucin Power Essence" },
];

const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];

type Suggestion = (typeof MOCK_SUGGESTIONS)[number];
type FreqType = "daily" | "interval" | "weekly";

type FormState = {
  brand: string;
  name: string;
  pao: string;
  openedAt: Date;
  showDatePicker: boolean;
  calendarViewMonth: Date;
  noEndDate: boolean;
  endDate: Date | null;
  showEndDatePicker: boolean;
  endCalendarViewMonth: Date;
  selectedRoutine: TimeOfDay[];
  imageUri: string | null;
  freqType: FreqType;
  intervalDays: string;
  selectedWeekDays: number[];
  suggestions: Suggestion[];
};

type FormAction =
  | { type: "setBrand"; brand: string }
  | { type: "setName"; name: string }
  | { type: "selectSuggestion"; suggestion: Suggestion }
  | { type: "setPao"; pao: string }
  | { type: "openDatePicker" }
  | { type: "closeDatePicker" }
  | { type: "shiftCalendarMonth"; by: number }
  | { type: "setOpenedAt"; date: Date }
  | { type: "resetOpenedAt"; today: Date }
  | { type: "openEndDatePicker"; today: Date }
  | { type: "closeEndDatePicker" }
  | { type: "shiftEndCalendarMonth"; by: number }
  | { type: "setEndDate"; date: Date }
  | { type: "toggleNoEndDate" }
  | { type: "toggleRoutine"; time: TimeOfDay }
  | { type: "setImage"; uri: string }
  | { type: "setFreqType"; freqType: FreqType }
  | { type: "setIntervalDays"; days: string }
  | { type: "toggleWeekDay"; dayIndex: number };

const createInitialForm = (): FormState => ({
  brand: "",
  name: "",
  pao: "12",
  openedAt: new Date(),
  showDatePicker: false,
  calendarViewMonth: new Date(),
  noEndDate: true,
  endDate: null,
  showEndDatePicker: false,
  endCalendarViewMonth: new Date(),
  selectedRoutine: [],
  imageUri: null,
  freqType: "daily",
  intervalDays: "2",
  selectedWeekDays: [],
  suggestions: [],
});

const toggleItem = <T,>(items: T[], item: T) =>
  items.includes(item) ? items.filter((i) => i !== item) : [...items, item];

const findSuggestions = (text: string) => {
  if (text.length <= 1) return [];
  const query = text.toLowerCase();
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.brand.toLowerCase().includes(query),
  ).slice(0, 3);
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setBrand":
      return { ...state, brand: action.brand };
    case "setName":
      return {
        ...state,
        name: action.name,
        suggestions: findSuggestions(action.name),
      };
    case "selectSuggestion":
      return {
        ...state,
        brand: action.suggestion.brand,
        name: action.suggestion.name,
        suggestions: [],
      };
    case "setPao":
      return { ...state, pao: action.pao };
    case "openDatePicker":
      return {
        ...state,
        calendarViewMonth: state.openedAt,
        showDatePicker: true,
      };
    case "closeDatePicker":
      return { ...state, showDatePicker: false };
    case "shiftCalendarMonth":
      return {
        ...state,
        calendarViewMonth: addMonths(state.calendarViewMonth, action.by),
      };
    case "setOpenedAt":
      return { ...state, openedAt: action.date };
    case "resetOpenedAt":
      return {
        ...state,
        openedAt: action.today,
        calendarViewMonth: action.today,
      };
    case "openEndDatePicker":
      if (state.noEndDate) return state;
      return {
        ...state,
        endCalendarViewMonth: state.endDate ?? action.today,
        showEndDatePicker: true,
      };
    case "closeEndDatePicker":
      return { ...state, showEndDatePicker: false };
    case "shiftEndCalendarMonth":
      return {
        ...state,
        endCalendarViewMonth: addMonths(state.endCalendarViewMonth, action.by),
      };
    case "setEndDate":
      return { ...state, endDate: action.date };
    case "toggleNoEndDate":
      return {
        ...state,
        noEndDate: !state.noEndDate,
        endDate: state.noEndDate ? null : state.endDate,
      };
    case "toggleRoutine":
      return {
        ...state,
        selectedRoutine: toggleItem(state.selectedRoutine, action.time),
      };
    case "setImage":
      return { ...state, imageUri: action.uri };
    case "setFreqType":
      return { ...state, freqType: action.freqType };
    case "setIntervalDays":
      return { ...state, intervalDays: action.days };
    case "toggleWeekDay":
      return {
        ...state,
        selectedWeekDays: toggleItem(state.selectedWeekDays, action.dayIndex),
      };
  }
}

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct } = useCosmetics();
  const { addToRoutine } = useRoutine();
  const { colors } = useTheme();
  const { t, formatDate } = useIntl();

  const [form, dispatch] = useReducer(
    formReducer,
    undefined,
    createInitialForm,
  );
  const {
    brand,
    name,
    pao,
    openedAt,
    showDatePicker,
    calendarViewMonth,
    noEndDate,
    endDate,
    showEndDatePicker,
    endCalendarViewMonth,
    selectedRoutine,
    imageUri,
    freqType,
    intervalDays,
    selectedWeekDays,
    suggestions,
  } = form;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarViewMonth);
    const monthEnd = endOfMonth(calendarViewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    return { days, startPadding };
  }, [calendarViewMonth]);

  const endCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(endCalendarViewMonth);
    const monthEnd = endOfMonth(endCalendarViewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startPadding = getDay(monthStart);
    return { days, startPadding };
  }, [endCalendarViewMonth]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      dispatch({ type: "setImage", uri: result.assets[0].uri });
    }
  };

  const handleSave = () => {
    if (!name || !brand) return;

    let frequency: Frequency = { type: "daily" };

    if (freqType === "interval") {
      frequency = { type: "interval", days: parseInt(intervalDays) || 2 };
    } else if (freqType === "weekly") {
      frequency = {
        type: "weekly",
        daysOfWeek: selectedWeekDays.length > 0 ? selectedWeekDays : [1, 3, 5],
      };
    }

    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      brand,
      name,
      openedAt: openedAt.toISOString(),
      periodAfterOpening: parseInt(pao) || 12,
      image: imageUri || undefined,
      frequency,
      endDate: noEndDate ? undefined : endDate?.toISOString(),
    };

    addProduct(newProduct, {
      onSuccess: () => {
        selectedRoutine.forEach((time) => {
          addToRoutine({ productId: newProduct.id, timeOfDay: time });
        });

        router.back();
      },
    });
  };

  const insets = useSafeAreaInsets();

  const renderCalendarGrid = (
    days: Date[],
    startPadding: number,
    selectedDate: Date,
    onSelectDate: (date: Date) => void,
    minDate?: Date,
  ) => {
    const rows: React.ReactNode[] = [];

    rows.push(
      <XStack key="header" justifyContent="space-between" marginBottom={8}>
        {WEEKDAY_INDEXES.map((dayIndex) => (
          <YStack
            key={dayIndex}
            width={44}
            height={28}
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={12} fontWeight="600" color={colors.subtext}>
              {formatDate(new Date(2020, 5, 7 + dayIndex), "weekdayShort")}
            </Text>
          </YStack>
        ))}
      </XStack>,
    );

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startPadding; i++) {
      cells.push(<YStack key={`pad-${i}`} width={44} height={38} />);
    }

    days.forEach((day) => {
      const isSelected = isSameDay(day, selectedDate);
      const isToday = isSameDay(day, new Date());
      const isDisabled = minDate ? isAfter(minDate, day) : false;

      cells.push(
        <YStack
          key={day.toISOString()}
          width={44}
          height={38}
          borderRadius={19}
          justifyContent="center"
          alignItems="center"
          backgroundColor={isSelected ? colors.tint : "transparent"}
          borderWidth={isToday && !isSelected ? 1 : 0}
          borderColor={colors.tint}
          opacity={isDisabled ? 0.3 : 1}
          onPress={() => !isDisabled && onSelectDate(day)}
        >
          <Text
            fontSize={14}
            fontWeight={isSelected || isToday ? "600" : "400"}
            color={isSelected ? "#FFFFFF" : isToday ? colors.tint : colors.text}
          >
            {day.getDate()}
          </Text>
        </YStack>,
      );
    });

    const totalCells = cells.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(<YStack key={`end-pad-${i}`} width={44} height={38} />);
    }

    for (let i = 0; i < cells.length; i += 7) {
      rows.push(
        <XStack
          key={`row-${i}`}
          justifyContent="space-between"
          marginBottom={4}
        >
          {cells.slice(i, i + 7)}
        </XStack>,
      );
    }

    return rows;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
            {t("add.title")}
          </Text>
          <YStack
            paddingHorizontal={16}
            paddingVertical={8}
            borderRadius={20}
            backgroundColor={!name || !brand ? colors.border : colors.tint}
            opacity={!name || !brand ? 0.7 : 1}
            onPress={handleSave}
            disabled={!name || !brand}
          >
            <Text
              fontWeight="600"
              fontSize={14}
              color={!name || !brand ? colors.subtext : "#FFF"}
            >
              {t("common.save")}
            </Text>
          </YStack>
        </XStack>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <YStack alignItems="center" marginBottom={8}>
            <YStack
              width={120}
              height={120}
              borderRadius={40}
              justifyContent="center"
              alignItems="center"
              backgroundColor={colors.card}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.1}
              shadowRadius={8}
              elevation={3}
              position="relative"
              onPress={pickImage}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%", borderRadius: 40 }}
                  contentFit="cover"
                />
              ) : (
                <YStack alignItems="center">
                  <Camera size={32} color={colors.tabIconDefault} />
                  <Text fontSize={12} fontWeight="500" color={colors.subtext}>
                    {t("add.addPhoto")}
                  </Text>
                </YStack>
              )}
              {imageUri && (
                <YStack
                  position="absolute"
                  bottom={0}
                  right={0}
                  padding={6}
                  borderRadius={12}
                  borderWidth={2}
                  backgroundColor={colors.tint}
                  borderColor={colors.background}
                >
                  <ImageIcon size={12} color="#FFF" />
                </YStack>
              )}
            </YStack>
          </YStack>

          <YStack zIndex={10}>
            <Text
              fontSize={14}
              fontWeight="500"
              marginLeft={4}
              color={colors.subtext}
            >
              {t("add.productName")}
            </Text>
            <Input
              borderRadius={16}
              padding={16}
              fontSize={16}
              borderWidth={1}
              borderColor="transparent"
              backgroundColor={colors.card}
              color={colors.text}
              placeholder={t("add.productNamePlaceholder")}
              value={name}
              onChangeText={(text) => dispatch({ type: "setName", name: text })}
              placeholderTextColor={colors.subtext}
            />
            {suggestions.length > 0 && (
              <YStack
                position="absolute"
                top="100%"
                left={0}
                right={0}
                borderRadius={16}
                marginTop={4}
                padding={8}
                zIndex={100}
                backgroundColor={colors.card}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 4 }}
                shadowOpacity={0.1}
                shadowRadius={12}
                elevation={8}
              >
                {suggestions.map((item, index) => (
                  <YStack
                    key={index}
                    paddingVertical={12}
                    paddingHorizontal={12}
                    borderBottomWidth={1}
                    borderBottomColor={colors.border}
                    onPress={() =>
                      dispatch({ type: "selectSuggestion", suggestion: item })
                    }
                  >
                    <Text fontSize={14} color={colors.text}>
                      <Text fontWeight="600">{item.brand}</Text> {item.name}
                    </Text>
                  </YStack>
                ))}
              </YStack>
            )}
          </YStack>

          <YStack zIndex={10}>
            <Text
              fontSize={14}
              fontWeight="500"
              marginLeft={4}
              color={colors.subtext}
            >
              {t("add.brand")}
            </Text>
            <Input
              borderRadius={16}
              padding={16}
              fontSize={16}
              borderWidth={1}
              borderColor="transparent"
              backgroundColor={colors.card}
              color={colors.text}
              placeholder={t("add.brandPlaceholder")}
              value={brand}
              onChangeText={(text) =>
                dispatch({ type: "setBrand", brand: text })
              }
              placeholderTextColor={colors.subtext}
            />
          </YStack>

          <XStack zIndex={0}>
            <YStack flex={1} marginRight={10}>
              <Text
                fontSize={14}
                fontWeight="500"
                marginLeft={4}
                color={colors.subtext}
              >
                {t("add.startDate")}
              </Text>
              <XStack
                borderRadius={16}
                padding={16}
                alignItems="center"
                backgroundColor={colors.card}
                onPress={() => dispatch({ type: "openDatePicker" })}
              >
                <Text fontSize={15} fontWeight="500" color={colors.text}>
                  {formatDate(openedAt, "productDate")}
                </Text>
              </XStack>
            </YStack>

            <YStack flex={1}>
              <Text
                fontSize={14}
                fontWeight="500"
                marginLeft={4}
                color={colors.subtext}
              >
                {t("add.paoMonths")}
              </Text>
              <XStack
                borderRadius={16}
                paddingHorizontal={16}
                alignItems="center"
                height={54}
                backgroundColor={colors.card}
              >
                <RotateCcw
                  size={16}
                  color={colors.subtext}
                  style={{ marginRight: 8 }}
                />
                <Input
                  flex={1}
                  fontSize={16}
                  height="100%"
                  backgroundColor="transparent"
                  borderWidth={0}
                  color={colors.text}
                  placeholder="12"
                  value={pao}
                  onChangeText={(text) =>
                    dispatch({ type: "setPao", pao: text })
                  }
                  keyboardType="numeric"
                  placeholderTextColor={colors.subtext}
                />
              </XStack>
            </YStack>
          </XStack>

          <YStack zIndex={0} marginTop={4}>
            <Text
              fontSize={14}
              fontWeight="500"
              marginLeft={4}
              color={colors.subtext}
            >
              {t("add.endDate")}
            </Text>
            <XStack alignItems="center" gap={10}>
              <XStack
                flex={1}
                borderRadius={16}
                padding={16}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor={colors.card}
                opacity={noEndDate ? 0.5 : 1}
                onPress={() =>
                  dispatch({ type: "openEndDatePicker", today: new Date() })
                }
              >
                <Text
                  fontSize={15}
                  fontWeight="500"
                  color={noEndDate ? colors.subtext : colors.text}
                >
                  {noEndDate
                    ? t("add.noEndDate")
                    : endDate
                      ? formatDate(endDate, "productDate")
                      : t("add.selectDate")}
                </Text>
              </XStack>
              <XStack
                borderRadius={16}
                padding={14}
                alignItems="center"
                gap={8}
                backgroundColor={noEndDate ? colors.tint : colors.card}
                onPress={() => dispatch({ type: "toggleNoEndDate" })}
              >
                <InfinityIcon
                  size={18}
                  color={noEndDate ? "#FFF" : colors.subtext}
                />
                <Text
                  fontSize={13}
                  fontWeight="600"
                  color={noEndDate ? "#FFF" : colors.subtext}
                >
                  {t("add.indefinite")}
                </Text>
              </XStack>
            </XStack>
          </YStack>

          <YStack marginTop={8}>
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              {t("add.frequency")}
            </Text>

            <XStack
              borderRadius={16}
              padding={4}
              marginBottom={8}
              backgroundColor={colors.border}
            >
              <YStack
                flex={1}
                paddingVertical={10}
                alignItems="center"
                borderRadius={12}
                backgroundColor={
                  freqType === "daily" ? colors.card : "transparent"
                }
                onPress={() =>
                  dispatch({ type: "setFreqType", freqType: "daily" })
                }
              >
                <Text
                  fontSize={13}
                  color={freqType === "daily" ? colors.text : colors.subtext}
                  fontWeight={freqType === "daily" ? "600" : "500"}
                >
                  {t("add.daily")}
                </Text>
              </YStack>
              <YStack
                flex={1}
                paddingVertical={10}
                alignItems="center"
                borderRadius={12}
                backgroundColor={
                  freqType === "weekly" ? colors.card : "transparent"
                }
                onPress={() =>
                  dispatch({ type: "setFreqType", freqType: "weekly" })
                }
              >
                <Text
                  fontSize={13}
                  color={freqType === "weekly" ? colors.text : colors.subtext}
                  fontWeight={freqType === "weekly" ? "600" : "500"}
                >
                  {t("add.specificDays")}
                </Text>
              </YStack>
              <YStack
                flex={1}
                paddingVertical={10}
                alignItems="center"
                borderRadius={12}
                backgroundColor={
                  freqType === "interval" ? colors.card : "transparent"
                }
                onPress={() =>
                  dispatch({ type: "setFreqType", freqType: "interval" })
                }
              >
                <Text
                  fontSize={13}
                  color={freqType === "interval" ? colors.text : colors.subtext}
                  fontWeight={freqType === "interval" ? "600" : "500"}
                >
                  {t("add.interval")}
                </Text>
              </YStack>
            </XStack>

            {freqType === "interval" && (
              <XStack
                alignItems="center"
                justifyContent="center"
                paddingVertical={8}
              >
                <Text fontSize={16} color={colors.text}>
                  {t("add.repeatEvery")}
                </Text>
                <Input
                  width={60}
                  height={44}
                  borderRadius={12}
                  fontSize={18}
                  fontWeight="600"
                  textAlign="center"
                  marginHorizontal={8}
                  backgroundColor={colors.card}
                  color={colors.tint}
                  borderWidth={0}
                  value={intervalDays}
                  onChangeText={(text) =>
                    dispatch({ type: "setIntervalDays", days: text })
                  }
                  keyboardType="numeric"
                />
                <Text fontSize={16} color={colors.text}>
                  {t("common.days")}
                </Text>
              </XStack>
            )}

            {freqType === "weekly" && (
              <XStack justifyContent="space-between" paddingVertical={8}>
                {WEEKDAY_INDEXES.map((dayIndex) => (
                  <YStack
                    key={dayIndex}
                    width={36}
                    height={36}
                    borderRadius={18}
                    justifyContent="center"
                    alignItems="center"
                    borderWidth={1}
                    borderColor="transparent"
                    backgroundColor={
                      selectedWeekDays.includes(dayIndex)
                        ? colors.tint
                        : colors.card
                    }
                    onPress={() =>
                      dispatch({ type: "toggleWeekDay", dayIndex })
                    }
                  >
                    <Text
                      fontSize={12}
                      fontWeight="600"
                      color={
                        selectedWeekDays.includes(dayIndex)
                          ? "#FFF"
                          : colors.subtext
                      }
                    >
                      {formatDate(
                        new Date(2020, 5, 7 + dayIndex),
                        "weekdayShort",
                      )}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            )}
          </YStack>

          <YStack marginTop={8}>
            <Text fontSize={16} fontWeight="600" color={colors.text}>
              {t("add.routineTime")}
            </Text>
            <XStack gap={12}>
              <XStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                paddingVertical={14}
                borderRadius={16}
                borderWidth={1}
                borderColor="transparent"
                backgroundColor={
                  selectedRoutine.includes("morning")
                    ? colors.tint
                    : colors.card
                }
                onPress={() =>
                  dispatch({ type: "toggleRoutine", time: "morning" })
                }
              >
                <Text
                  fontSize={15}
                  fontWeight="500"
                  color={
                    selectedRoutine.includes("morning") ? "#FFF" : colors.text
                  }
                >
                  {t("time.morning")}
                </Text>
                {selectedRoutine.includes("morning") && (
                  <Check size={16} color="#FFF" style={{ marginLeft: 8 }} />
                )}
              </XStack>

              <XStack
                flex={1}
                alignItems="center"
                justifyContent="center"
                paddingVertical={14}
                borderRadius={16}
                borderWidth={1}
                borderColor="transparent"
                backgroundColor={
                  selectedRoutine.includes("evening")
                    ? colors.tint
                    : colors.card
                }
                onPress={() =>
                  dispatch({ type: "toggleRoutine", time: "evening" })
                }
              >
                <Text
                  fontSize={15}
                  fontWeight="500"
                  color={
                    selectedRoutine.includes("evening") ? "#FFF" : colors.text
                  }
                >
                  {t("time.evening")}
                </Text>
                {selectedRoutine.includes("evening") && (
                  <Check size={16} color="#FFF" style={{ marginLeft: 8 }} />
                )}
              </XStack>
            </XStack>
          </YStack>

          <YStack height={40} />
        </ScrollView>

        <Modal visible={showDatePicker} transparent animationType="fade">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => {}}
          >
            <Pressable onPress={() => {}}>
              <YStack
                backgroundColor={colors.background}
                borderTopLeftRadius={28}
                borderTopRightRadius={28}
                padding={20}
                paddingBottom={Math.max(insets.bottom, 20)}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: -4 }}
                shadowOpacity={0.1}
                shadowRadius={16}
                elevation={10}
              >
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom={20}
                >
                  <Text fontSize={18} fontWeight="700" color={colors.text}>
                    {t("add.startDate")}
                  </Text>
                  <YStack
                    paddingHorizontal={16}
                    paddingVertical={8}
                    borderRadius={20}
                    backgroundColor={colors.tint}
                    onPress={() => dispatch({ type: "closeDatePicker" })}
                  >
                    <Text fontSize={14} fontWeight="600" color="#FFFFFF">
                      {t("common.done")}
                    </Text>
                  </YStack>
                </XStack>

                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom={16}
                >
                  <YStack
                    padding={8}
                    borderRadius={12}
                    backgroundColor={colors.card}
                    onPress={() =>
                      dispatch({ type: "shiftCalendarMonth", by: -1 })
                    }
                  >
                    <ChevronLeft size={20} color={colors.text} />
                  </YStack>
                  <Text fontSize={16} fontWeight="600" color={colors.text}>
                    {formatDate(calendarViewMonth, "monthYear")}
                  </Text>
                  <YStack
                    padding={8}
                    borderRadius={12}
                    backgroundColor={colors.card}
                    onPress={() =>
                      dispatch({ type: "shiftCalendarMonth", by: 1 })
                    }
                  >
                    <ChevronRight size={20} color={colors.text} />
                  </YStack>
                </XStack>

                {renderCalendarGrid(
                  calendarDays.days,
                  calendarDays.startPadding,
                  openedAt,
                  (day) => dispatch({ type: "setOpenedAt", date: day }),
                )}

                <XStack justifyContent="center" marginTop={12}>
                  <YStack
                    paddingHorizontal={20}
                    paddingVertical={10}
                    borderRadius={16}
                    backgroundColor={colors.card}
                    onPress={() =>
                      dispatch({ type: "resetOpenedAt", today: new Date() })
                    }
                  >
                    <Text fontSize={13} fontWeight="600" color={colors.tint}>
                      {t("common.today")}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={showEndDatePicker} transparent animationType="fade">
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
            onPress={() => {}}
          >
            <Pressable onPress={() => {}}>
              <YStack
                backgroundColor={colors.background}
                borderTopLeftRadius={28}
                borderTopRightRadius={28}
                padding={20}
                paddingBottom={Math.max(insets.bottom, 20)}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: -4 }}
                shadowOpacity={0.1}
                shadowRadius={16}
                elevation={10}
              >
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom={20}
                >
                  <Text fontSize={18} fontWeight="700" color={colors.text}>
                    {t("add.endDate")}
                  </Text>
                  <YStack
                    paddingHorizontal={16}
                    paddingVertical={8}
                    borderRadius={20}
                    backgroundColor={colors.tint}
                    onPress={() => dispatch({ type: "closeEndDatePicker" })}
                  >
                    <Text fontSize={14} fontWeight="600" color="#FFFFFF">
                      {t("common.done")}
                    </Text>
                  </YStack>
                </XStack>

                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  marginBottom={16}
                >
                  <YStack
                    padding={8}
                    borderRadius={12}
                    backgroundColor={colors.card}
                    onPress={() =>
                      dispatch({ type: "shiftEndCalendarMonth", by: -1 })
                    }
                  >
                    <ChevronLeft size={20} color={colors.text} />
                  </YStack>
                  <Text fontSize={16} fontWeight="600" color={colors.text}>
                    {formatDate(endCalendarViewMonth, "monthYear")}
                  </Text>
                  <YStack
                    padding={8}
                    borderRadius={12}
                    backgroundColor={colors.card}
                    onPress={() =>
                      dispatch({ type: "shiftEndCalendarMonth", by: 1 })
                    }
                  >
                    <ChevronRight size={20} color={colors.text} />
                  </YStack>
                </XStack>

                {renderCalendarGrid(
                  endCalendarDays.days,
                  endCalendarDays.startPadding,
                  endDate || new Date(),
                  (day) => dispatch({ type: "setEndDate", date: day }),
                  openedAt,
                )}
              </YStack>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}
