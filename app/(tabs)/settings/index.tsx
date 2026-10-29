import React from "react";
import { Platform, Alert, Share } from "react-native";
import { YStack, XStack, Text, Separator, ScrollView } from "tamagui";
import { useTheme } from "@/context/theme";
import { useIntl, type AppLocale } from "@/context/intl";
import { useCosmetics } from "@/context/cosmetics";
import { useRoutine } from "@/context/routine";
import {
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  FileText,
  Shield,
  Mail,
  Star,
  Download,
  Trash2,
  FlaskConical,
  Check,
} from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";

const PRIVACY_POLICY_URL = "https://cera.love/privacy";
const TERMS_URL = "https://cera.love/terms";
const SUPPORT_EMAIL = "help@cera.love";
const APP_STORE_URL = "https://apps.apple.com/app/id0000000000"; // Replace with actual ID
const LANGUAGE_LABEL_KEYS = {
  en: "language.en",
  pl: "language.pl",
  ua: "language.ua",
} as const satisfies Record<
  AppLocale,
  Parameters<ReturnType<typeof useIntl>["t"]>[0]
>;
const LANGUAGE_FLAGS = {
  en: "🇬🇧",
  pl: "🇵🇱",
  ua: "🇺🇦",
} as const satisfies Record<AppLocale, string>;

// TODO: Replace with actual feature flag from backend/auth system
const useIsDeveloper = () => {
  // This will come from your auth context / feature flags
  // e.g., return useAuth().user?.role === 'developer'
  // e.g., return useFeatureFlags().isDeveloper
  return false;
};

export default function SettingsScreen() {
  const { themeMode, setTheme, colors, showDetailedConflicts, setAppSettings } =
    useTheme();
  const { locale, locales, setLocale, t } = useIntl();
  const { products } = useCosmetics();
  const { routineConfig, routineHistory } = useRoutine();
  const queryClient = useQueryClient();
  const isDeveloper = useIsDeveloper();

  const handleOpenURL = async (url: string) => {
    if (Platform.OS === "web") {
      window.open(url, "_blank");
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(t("settings.supportSubject"));
    const body = encodeURIComponent(
      `\n\n---\nApp Version: 1.0.0\nPlatform: ${Platform.OS}`,
    );
    void Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
    );
  };

  const handleRateApp = () => {
    if (Platform.OS === "ios") {
      void Linking.openURL(APP_STORE_URL);
    } else if (Platform.OS === "android") {
      void Linking.openURL(
        "market://details?id=app.rork.kalendarz_kosmetykow_twarz",
      );
    } else {
      Alert.alert(t("settings.rateTitle"), t("settings.rateBody"));
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        products,
        routineConfig,
        routineHistory,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `skincare-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: jsonString,
          title: t("settings.exportData"),
        });
      }
    } catch {
      Alert.alert(t("settings.exportFailed"), t("settings.exportFailedBody"));
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(t("settings.deleteAllData"), t("settings.deleteAllDataBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "cosmetics_shelf",
            "routine_config",
            "routine_history",
          ]);
          if (Platform.OS === "web") {
            window.location.reload();
          } else {
            await queryClient.resetQueries();
          }
        },
      },
    ]);
  };

  const SettingsRow = ({
    icon,
    label,
    onPress,
    showChevron = true,
    danger = false,
    subtitle,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    showChevron?: boolean;
    danger?: boolean;
    subtitle?: string;
  }) => (
    <XStack
      alignItems="center"
      padding={16}
      pressStyle={{ opacity: 0.7 }}
      onPress={onPress}
    >
      <YStack marginRight={12}>{icon}</YStack>
      <YStack flex={1}>
        <Text
          fontSize={16}
          color={danger ? colors.error : colors.text}
          fontWeight="500"
        >
          {label}
        </Text>
        {subtitle && (
          <Text fontSize={13} color={colors.subtext} marginTop={2}>
            {subtitle}
          </Text>
        )}
      </YStack>
      {showChevron && <ChevronRight size={18} color={colors.subtext} />}
    </XStack>
  );

  const LanguageRow = ({ language }: { language: AppLocale }) => {
    const selected = locale === language;

    return (
      <XStack
        alignItems="center"
        padding={16}
        backgroundColor={selected ? colors.border : colors.card}
        onPress={() => void setLocale(language)}
      >
        <YStack width={24} marginRight={12} alignItems="center">
          <Text fontSize={20}>{LANGUAGE_FLAGS[language]}</Text>
        </YStack>
        <Text
          flex={1}
          fontSize={16}
          color={selected ? colors.tint : colors.text}
          fontWeight={selected ? "600" : "500"}
        >
          {t(LANGUAGE_LABEL_KEYS[language])}
        </Text>
        {selected && <Check size={18} color={colors.tint} />}
      </XStack>
    );
  };

  return (
    <ScrollView flex={1} backgroundColor={colors.background}>
      <YStack padding={20} paddingBottom={40}>
        {/* Ingredient Analysis Section */}
        <YStack marginBottom={32}>
          <Text
            fontSize={14}
            fontWeight="600"
            marginBottom={12}
            textTransform="uppercase"
            letterSpacing={0.5}
            color={colors.subtext}
          >
            {t("settings.ingredientAnalysis")}
          </Text>
          <YStack
            borderRadius={16}
            borderWidth={1}
            overflow="hidden"
            backgroundColor={colors.card}
            borderColor={colors.border}
          >
            <XStack
              alignItems="center"
              padding={16}
              onPress={() =>
                setAppSettings({
                  showDetailedConflicts: !showDetailedConflicts,
                })
              }
            >
              <YStack marginRight={12}>
                <FlaskConical size={20} color={colors.text} />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={16} color={colors.text} fontWeight="500">
                  {t("settings.detailedExplanations")}
                </Text>
                <Text fontSize={13} color={colors.subtext} marginTop={2}>
                  {t("settings.detailedExplanationsBody")}
                </Text>
              </YStack>
              <YStack
                width={50}
                height={30}
                borderRadius={15}
                justifyContent="center"
                paddingHorizontal={3}
                backgroundColor={
                  showDetailedConflicts ? colors.tint : colors.border
                }
              >
                <YStack
                  width={24}
                  height={24}
                  borderRadius={12}
                  backgroundColor="#FFFFFF"
                  alignSelf={showDetailedConflicts ? "flex-end" : "flex-start"}
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 1 }}
                  shadowOpacity={0.15}
                  shadowRadius={2}
                  elevation={2}
                />
              </YStack>
            </XStack>
          </YStack>
        </YStack>

        <YStack marginBottom={32}>
          <Text
            fontSize={14}
            fontWeight="600"
            marginBottom={12}
            textTransform="uppercase"
            letterSpacing={0.5}
            color={colors.subtext}
          >
            {t("language.section")}
          </Text>
          <YStack
            borderRadius={16}
            borderWidth={1}
            overflow="hidden"
            backgroundColor={colors.card}
            borderColor={colors.border}
          >
            {locales.map((language, index) => (
              <React.Fragment key={language}>
                <LanguageRow language={language} />
                {index < locales.length - 1 && (
                  <Separator marginLeft={48} backgroundColor={colors.border} />
                )}
              </React.Fragment>
            ))}
          </YStack>
        </YStack>

        {/* Appearance Section */}
        <YStack marginBottom={32}>
          <Text
            fontSize={14}
            fontWeight="600"
            marginBottom={12}
            textTransform="uppercase"
            letterSpacing={0.5}
            color={colors.subtext}
          >
            {t("settings.appearance")}
          </Text>
          <YStack
            borderRadius={16}
            borderWidth={1}
            overflow="hidden"
            backgroundColor={colors.card}
            borderColor={colors.border}
          >
            <XStack
              alignItems="center"
              padding={16}
              backgroundColor={
                themeMode === "light" ? colors.border : colors.card
              }
              onPress={() => setTheme("light")}
            >
              <YStack marginRight={12}>
                <Sun
                  size={20}
                  color={themeMode === "light" ? colors.tint : colors.text}
                />
              </YStack>
              <Text
                fontSize={16}
                color={themeMode === "light" ? colors.tint : colors.text}
                fontWeight={themeMode === "light" ? "600" : "500"}
              >
                {t("settings.light")}
              </Text>
            </XStack>
            <Separator marginLeft={48} backgroundColor={colors.border} />
            <XStack
              alignItems="center"
              padding={16}
              backgroundColor={
                themeMode === "dark" ? colors.border : colors.card
              }
              onPress={() => setTheme("dark")}
            >
              <YStack marginRight={12}>
                <Moon
                  size={20}
                  color={themeMode === "dark" ? colors.tint : colors.text}
                />
              </YStack>
              <Text
                fontSize={16}
                color={themeMode === "dark" ? colors.tint : colors.text}
                fontWeight={themeMode === "dark" ? "600" : "500"}
              >
                {t("settings.dark")}
              </Text>
            </XStack>
            <Separator marginLeft={48} backgroundColor={colors.border} />
            <XStack
              alignItems="center"
              padding={16}
              backgroundColor={
                themeMode === "auto" ? colors.border : colors.card
              }
              onPress={() => setTheme("auto")}
            >
              <YStack marginRight={12}>
                <Monitor
                  size={20}
                  color={themeMode === "auto" ? colors.tint : colors.text}
                />
              </YStack>
              <Text
                fontSize={16}
                color={themeMode === "auto" ? colors.tint : colors.text}
                fontWeight={themeMode === "auto" ? "600" : "500"}
              >
                {t("settings.auto")}
              </Text>
            </XStack>
          </YStack>
        </YStack>

        {/* Data Section - Developer Only */}
        {isDeveloper && (
          <YStack marginBottom={32}>
            <Text
              fontSize={14}
              fontWeight="600"
              marginBottom={12}
              textTransform="uppercase"
              letterSpacing={0.5}
              color={colors.subtext}
            >
              {t("settings.developer")}
            </Text>
            <YStack
              borderRadius={16}
              borderWidth={1}
              overflow="hidden"
              backgroundColor={colors.card}
              borderColor={colors.border}
            >
              <SettingsRow
                icon={<Download size={20} color={colors.text} />}
                label={t("settings.exportData")}
                subtitle={t("settings.productsCount", {
                  count: products.length,
                })}
                onPress={handleExportData}
              />
              <Separator marginLeft={48} backgroundColor={colors.border} />
              <SettingsRow
                icon={<Trash2 size={20} color={colors.error} />}
                label={t("settings.deleteAllData")}
                onPress={handleDeleteAllData}
                showChevron={false}
                danger
              />
            </YStack>
          </YStack>
        )}

        {/* Support Section */}
        <YStack marginBottom={32}>
          <Text
            fontSize={14}
            fontWeight="600"
            marginBottom={12}
            textTransform="uppercase"
            letterSpacing={0.5}
            color={colors.subtext}
          >
            {t("settings.support")}
          </Text>
          <YStack
            borderRadius={16}
            borderWidth={1}
            overflow="hidden"
            backgroundColor={colors.card}
            borderColor={colors.border}
          >
            <SettingsRow
              icon={<Mail size={20} color={colors.text} />}
              label={t("settings.contactSupport")}
              subtitle={SUPPORT_EMAIL}
              onPress={handleContactSupport}
            />
            <Separator marginLeft={48} backgroundColor={colors.border} />
            <SettingsRow
              icon={<Star size={20} color={colors.text} />}
              label={t("settings.rateApp")}
              onPress={handleRateApp}
            />
          </YStack>
        </YStack>

        {/* Legal Section */}
        <YStack marginBottom={32}>
          <Text
            fontSize={14}
            fontWeight="600"
            marginBottom={12}
            textTransform="uppercase"
            letterSpacing={0.5}
            color={colors.subtext}
          >
            {t("settings.legal")}
          </Text>
          <YStack
            borderRadius={16}
            borderWidth={1}
            overflow="hidden"
            backgroundColor={colors.card}
            borderColor={colors.border}
          >
            <SettingsRow
              icon={<Shield size={20} color={colors.text} />}
              label={t("settings.privacyPolicy")}
              onPress={() => handleOpenURL(PRIVACY_POLICY_URL)}
            />
            <Separator marginLeft={48} backgroundColor={colors.border} />
            <SettingsRow
              icon={<FileText size={20} color={colors.text} />}
              label={t("settings.terms")}
              onPress={() => handleOpenURL(TERMS_URL)}
            />
          </YStack>
        </YStack>

        {/* Version */}
        <YStack alignItems="center" marginTop={20}>
          <Text fontSize={12} color={colors.subtext}>
            {t("common.version", { version: "1.0.0" })}
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
