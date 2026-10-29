import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useReducer } from "react";

export type AppLocale = "en" | "pl" | "ua";

type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = "app_locale";
const SUPPORTED_LOCALES: AppLocale[] = ["en", "pl", "ua"];

const enTranslations = {
  "add.addPhoto": "Add Photo",
  "add.brand": "Brand",
  "add.brandPlaceholder": "e.g. The Ordinary",
  "add.daily": "Daily",
  "add.endDate": "End Date",
  "add.frequency": "Frequency",
  "add.indefinite": "Indefinite",
  "add.interval": "Interval",
  "add.noEndDate": "No end date",
  "add.paoMonths": "PAO (Months)",
  "add.productName": "Product Name",
  "add.productNamePlaceholder": "e.g. Niacinamide 10% + Zinc 1%",
  "add.repeatEvery": "Repeat every",
  "add.routineTime": "Routine Time",
  "add.selectDate": "Select date",
  "add.specificDays": "Specific Days",
  "add.startDate": "Start Date",
  "add.title": "Add Product",
  "calendar.noRoutineData": "No routine data for {date}",
  "calendar.noProductsUsed": "No products used on this day",
  "calendar.title": "Usage Calendar",
  "common.cancel": "Cancel",
  "common.days": "days",
  "common.delete": "Delete",
  "common.done": "Done",
  "common.oops": "Oops!",
  "common.save": "Save",
  "common.today": "Today",
  "common.version": "Version {version}",
  "error.message": "Something went wrong",
  "error.subtitle": "An unexpected error occurred",
  "error.tryAgain": "Try Again",
  "error.restart": "If this keeps happening, try restarting the app",
  "ingredients.compatibleBody": "Your products are compatible with each other",
  "ingredients.compatibleTitle": "No Conflicts Found",
  "ingredients.conflictsDetected": "{count} ingredient conflicts detected",
  "ingredients.highSeverity": "{count} high severity",
  "ingredients.reviewCombinations": "Review your product combinations",
  "ingredients.showLess": "Show Less",
  "ingredients.showMore": "Show {count} More",
  "language.en": "English",
  "language.pl": "Polski",
  "language.ua": "Українська",
  "language.section": "Language",
  "notFound.body": "This screen doesn't exist.",
  "notFound.home": "Go to home screen!",
  "routine.emptyBody":
    "Add products to your shelf and assign them to your routine to get started.",
  "routine.emptyTitle": "Your routine is empty.",
  "routine.evening": "Evening",
  "routine.goToShelf": "Go to Shelf",
  "routine.morning": "Morning",
  "routine.title": "My Routine",
  "settings.appearance": "Appearance",
  "settings.auto": "Auto",
  "settings.contactSupport": "Contact Support",
  "settings.deleteAllData": "Delete All Data",
  "settings.deleteAllDataBody":
    "This will permanently delete all your products, routines, and history. This action cannot be undone.",
  "settings.detailedExplanations": "Detailed Explanations",
  "settings.detailedExplanationsBody":
    "Show why ingredients conflict. Warnings are always visible.",
  "settings.developer": "Developer",
  "settings.exportData": "Export Data",
  "settings.exportFailed": "Export Failed",
  "settings.exportFailedBody": "Could not export your data. Please try again.",
  "settings.ingredientAnalysis": "Ingredient Analysis",
  "settings.legal": "Legal",
  "settings.dark": "Dark",
  "settings.light": "Light",
  "settings.privacyPolicy": "Privacy Policy",
  "settings.productsCount": "{count} products",
  "settings.rateApp": "Rate the App",
  "settings.rateBody":
    "Thank you for your interest! Rating is available on mobile apps.",
  "settings.rateTitle": "Rate Us",
  "settings.support": "Support",
  "settings.supportSubject": "Skincare Calendar Support",
  "settings.terms": "Terms of Service",
  "shelf.addFirst": "Add First Product",
  "shelf.daysLeft": "{count} days left",
  "shelf.emptyBody":
    "Add your skincare products to track expiration dates and build your routine.",
  "shelf.emptyTitle": "Your shelf is empty",
  "shelf.expired": "Expired {count} days ago",
  "shelf.notOpened": "Not opened yet",
  "shelf.title": "My Shelf",
  "tabs.routine": "Routine",
  "tabs.settings": "Settings",
  "tabs.shelf": "Shelf",
  "time.evening": "Evening",
  "time.morning": "Morning",
  unknownProduct: "Unknown Product",
} as const;

export type TranslationKey = keyof typeof enTranslations;

const translations = {
  en: enTranslations,
  pl: {
    "add.addPhoto": "Dodaj zdjęcie",
    "add.brand": "Marka",
    "add.brandPlaceholder": "np. The Ordinary",
    "add.daily": "Codziennie",
    "add.endDate": "Data zakończenia",
    "add.frequency": "Częstotliwość",
    "add.indefinite": "Bezterminowo",
    "add.interval": "Interwał",
    "add.noEndDate": "Bez daty końcowej",
    "add.paoMonths": "PAO (miesiące)",
    "add.productName": "Nazwa produktu",
    "add.productNamePlaceholder": "np. Niacinamide 10% + Zinc 1%",
    "add.repeatEvery": "Powtarzaj co",
    "add.routineTime": "Pora rutyny",
    "add.selectDate": "Wybierz datę",
    "add.specificDays": "Wybrane dni",
    "add.startDate": "Data rozpoczęcia",
    "add.title": "Dodaj produkt",
    "calendar.noRoutineData": "Brak danych rutyny dla {date}",
    "calendar.noProductsUsed": "Brak użytych produktów tego dnia",
    "calendar.title": "Kalendarz użycia",
    "common.cancel": "Anuluj",
    "common.days": "dni",
    "common.delete": "Usuń",
    "common.done": "Gotowe",
    "common.oops": "Ups!",
    "common.save": "Zapisz",
    "common.today": "Dzisiaj",
    "common.version": "Wersja {version}",
    "error.message": "Coś poszło nie tak",
    "error.subtitle": "Wystąpił nieoczekiwany błąd",
    "error.tryAgain": "Spróbuj ponownie",
    "error.restart": "Jeśli problem się powtarza, uruchom aplikację ponownie",
    "ingredients.compatibleBody": "Twoje produkty są ze sobą kompatybilne",
    "ingredients.compatibleTitle": "Nie znaleziono konfliktów",
    "ingredients.conflictsDetected": "Wykryto konflikty składników: {count}",
    "ingredients.highSeverity": "Wysoka waga: {count}",
    "ingredients.reviewCombinations": "Sprawdź połączenia produktów",
    "ingredients.showLess": "Pokaż mniej",
    "ingredients.showMore": "Pokaż więcej: {count}",
    "language.en": "English",
    "language.pl": "Polski",
    "language.ua": "Українська",
    "language.section": "Język",
    "notFound.body": "Ten ekran nie istnieje.",
    "notFound.home": "Przejdź do ekranu głównego!",
    "routine.emptyBody":
      "Dodaj produkty do półki i przypisz je do rutyny, aby zacząć.",
    "routine.emptyTitle": "Twoja rutyna jest pusta.",
    "routine.evening": "Wieczór",
    "routine.goToShelf": "Przejdź do półki",
    "routine.morning": "Rano",
    "routine.title": "Moja rutyna",
    "settings.appearance": "Wygląd",
    "settings.auto": "Automatycznie",
    "settings.contactSupport": "Kontakt z pomocą",
    "settings.deleteAllData": "Usuń wszystkie dane",
    "settings.deleteAllDataBody":
      "To trwale usunie wszystkie produkty, rutyny i historię. Tej akcji nie można cofnąć.",
    "settings.detailedExplanations": "Szczegółowe wyjaśnienia",
    "settings.detailedExplanationsBody":
      "Pokazuj, dlaczego składniki się wykluczają. Ostrzeżenia są zawsze widoczne.",
    "settings.developer": "Deweloper",
    "settings.exportData": "Eksport danych",
    "settings.exportFailed": "Eksport nieudany",
    "settings.exportFailedBody":
      "Nie można wyeksportować danych. Spróbuj ponownie.",
    "settings.ingredientAnalysis": "Analiza składników",
    "settings.legal": "Informacje prawne",
    "settings.dark": "Ciemny",
    "settings.light": "Jasny",
    "settings.privacyPolicy": "Polityka prywatności",
    "settings.productsCount": "Produkty: {count}",
    "settings.rateApp": "Oceń aplikację",
    "settings.rateBody":
      "Dziękujemy za zainteresowanie. Ocena jest dostępna w aplikacjach mobilnych.",
    "settings.rateTitle": "Oceń nas",
    "settings.support": "Pomoc",
    "settings.supportSubject": "Pomoc Skincare Calendar",
    "settings.terms": "Regulamin",
    "shelf.addFirst": "Dodaj pierwszy produkt",
    "shelf.daysLeft": "Pozostało dni: {count}",
    "shelf.emptyBody":
      "Dodaj produkty pielęgnacyjne, aby śledzić daty ważności i budować rutynę.",
    "shelf.emptyTitle": "Twoja półka jest pusta",
    "shelf.expired": "Przeterminowano dni temu: {count}",
    "shelf.notOpened": "Jeszcze nie otwarto",
    "shelf.title": "Moja półka",
    "tabs.routine": "Rutyna",
    "tabs.settings": "Ustawienia",
    "tabs.shelf": "Półka",
    "time.evening": "Wieczór",
    "time.morning": "Rano",
    unknownProduct: "Nieznany produkt",
  },
  ua: {
    "add.addPhoto": "Додати фото",
    "add.brand": "Бренд",
    "add.brandPlaceholder": "напр. The Ordinary",
    "add.daily": "Щодня",
    "add.endDate": "Дата завершення",
    "add.frequency": "Частота",
    "add.indefinite": "Безстроково",
    "add.interval": "Інтервал",
    "add.noEndDate": "Без дати завершення",
    "add.paoMonths": "PAO (місяці)",
    "add.productName": "Назва продукту",
    "add.productNamePlaceholder": "напр. Niacinamide 10% + Zinc 1%",
    "add.repeatEvery": "Повторювати кожні",
    "add.routineTime": "Час рутини",
    "add.selectDate": "Виберіть дату",
    "add.specificDays": "Окремі дні",
    "add.startDate": "Дата початку",
    "add.title": "Додати продукт",
    "calendar.noRoutineData": "Немає даних рутини за {date}",
    "calendar.noProductsUsed": "Цього дня продукти не використовувались",
    "calendar.title": "Календар використання",
    "common.cancel": "Скасувати",
    "common.days": "днів",
    "common.delete": "Видалити",
    "common.done": "Готово",
    "common.oops": "Ой!",
    "common.save": "Зберегти",
    "common.today": "Сьогодні",
    "common.version": "Версія {version}",
    "error.message": "Щось пішло не так",
    "error.subtitle": "Сталася неочікувана помилка",
    "error.tryAgain": "Спробувати ще раз",
    "error.restart": "Якщо проблема повторюється, перезапустіть застосунок",
    "ingredients.compatibleBody": "Ваші продукти сумісні між собою",
    "ingredients.compatibleTitle": "Конфліктів не знайдено",
    "ingredients.conflictsDetected": "Виявлено конфлікти інгредієнтів: {count}",
    "ingredients.highSeverity": "Висока серйозність: {count}",
    "ingredients.reviewCombinations": "Перевірте поєднання продуктів",
    "ingredients.showLess": "Показати менше",
    "ingredients.showMore": "Показати ще: {count}",
    "language.en": "English",
    "language.pl": "Polski",
    "language.ua": "Українська",
    "language.section": "Мова",
    "notFound.body": "Цього екрана не існує.",
    "notFound.home": "Перейти на головний екран!",
    "routine.emptyBody":
      "Додайте продукти на полицю та призначте їх до рутини, щоб почати.",
    "routine.emptyTitle": "Ваша рутина порожня.",
    "routine.evening": "Вечір",
    "routine.goToShelf": "Перейти до полиці",
    "routine.morning": "Ранок",
    "routine.title": "Моя рутина",
    "settings.appearance": "Вигляд",
    "settings.auto": "Автоматично",
    "settings.contactSupport": "Зв’язатися з підтримкою",
    "settings.deleteAllData": "Видалити всі дані",
    "settings.deleteAllDataBody":
      "Це назавжди видалить усі продукти, рутини та історію. Цю дію не можна скасувати.",
    "settings.detailedExplanations": "Детальні пояснення",
    "settings.detailedExplanationsBody":
      "Показувати, чому інгредієнти конфліктують. Попередження завжди видимі.",
    "settings.developer": "Розробник",
    "settings.exportData": "Експорт даних",
    "settings.exportFailed": "Помилка експорту",
    "settings.exportFailedBody":
      "Не вдалося експортувати дані. Спробуйте ще раз.",
    "settings.ingredientAnalysis": "Аналіз інгредієнтів",
    "settings.legal": "Правова інформація",
    "settings.dark": "Темна",
    "settings.light": "Світла",
    "settings.privacyPolicy": "Політика конфіденційності",
    "settings.productsCount": "Продуктів: {count}",
    "settings.rateApp": "Оцінити застосунок",
    "settings.rateBody":
      "Дякуємо за інтерес. Оцінювання доступне в мобільних застосунках.",
    "settings.rateTitle": "Оцініть нас",
    "settings.support": "Підтримка",
    "settings.supportSubject": "Підтримка Skincare Calendar",
    "settings.terms": "Умови використання",
    "shelf.addFirst": "Додати перший продукт",
    "shelf.daysLeft": "Залишилось днів: {count}",
    "shelf.emptyBody":
      "Додайте продукти догляду, щоб відстежувати терміни придатності та будувати рутину.",
    "shelf.emptyTitle": "Ваша полиця порожня",
    "shelf.expired": "Прострочено днів тому: {count}",
    "shelf.notOpened": "Ще не відкрито",
    "shelf.title": "Моя полиця",
    "tabs.routine": "Рутина",
    "tabs.settings": "Налаштування",
    "tabs.shelf": "Полиця",
    "time.evening": "Вечір",
    "time.morning": "Ранок",
    unknownProduct: "Невідомий продукт",
  },
} satisfies Record<AppLocale, Record<TranslationKey, string>>;

const intlLocaleTags = {
  en: "en-US",
  pl: "pl-PL",
  ua: "uk-UA",
} satisfies Record<AppLocale, string>;

const dateFormatOptions = {
  dayMonth: { day: "numeric", month: "long", year: "numeric" },
  longDayMonth: { weekday: "long", day: "numeric", month: "long" },
  monthYear: { month: "long", year: "numeric" },
  productDate: { day: "2-digit", month: "short", year: "numeric" },
  weekdayShort: { weekday: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateFormatKey = keyof typeof dateFormatOptions;

const normalizeLocale = (value?: string | null): AppLocale | null => {
  if (!value) return null;

  const language = value.toLowerCase().split(/[-_]/)[0];
  if (language === "uk" || language === "ua") return "ua";
  if (SUPPORTED_LOCALES.includes(language as AppLocale))
    return language as AppLocale;

  return null;
};

const getSystemLocale = (): AppLocale => {
  if (typeof navigator !== "undefined") {
    const navigatorLocale = normalizeLocale(navigator.language);
    if (navigatorLocale) return navigatorLocale;
  }

  const intlLocale = normalizeLocale(
    Intl.DateTimeFormat().resolvedOptions().locale,
  );
  return intlLocale ?? "en";
};

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? `{${key}}`),
  );
};

type LocaleState = { locale: AppLocale; isLocaleReady: boolean };

type LocaleAction =
  | { type: "loaded"; storedLocale: AppLocale | null }
  | { type: "setLocale"; locale: AppLocale };

function localeReducer(state: LocaleState, action: LocaleAction): LocaleState {
  switch (action.type) {
    case "loaded":
      return {
        locale: action.storedLocale ?? state.locale,
        isLocaleReady: true,
      };
    case "setLocale":
      return { ...state, locale: action.locale };
  }
}

export const [IntlProvider, useIntl] = createContextHook(() => {
  const [{ locale, isLocaleReady }, dispatch] = useReducer(
    localeReducer,
    undefined,
    () => ({ locale: getSystemLocale(), isLocaleReady: false }),
  );

  useEffect(() => {
    void (async () => {
      let storedLocale: AppLocale | null = null;
      try {
        storedLocale = normalizeLocale(await AsyncStorage.getItem(STORAGE_KEY));
      } catch (err) {
        console.error("Failed to read locale from AsyncStorage", err);
      } finally {
        dispatch({ type: "loaded", storedLocale });
      }
    })();
  }, []);

  const setLocale = useCallback(async (nextLocale: AppLocale) => {
    dispatch({ type: "setLocale", locale: nextLocale });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
    } catch (err) {
      console.error("Failed to save locale to AsyncStorage", err);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      return interpolate(
        translations[locale][key] ?? translations.en[key],
        params,
      );
    },
    [locale],
  );

  const dateFormatters = useMemo(
    () => ({
      dayMonth: new Intl.DateTimeFormat(
        intlLocaleTags[locale],
        dateFormatOptions.dayMonth,
      ),
      longDayMonth: new Intl.DateTimeFormat(
        intlLocaleTags[locale],
        dateFormatOptions.longDayMonth,
      ),
      monthYear: new Intl.DateTimeFormat(
        intlLocaleTags[locale],
        dateFormatOptions.monthYear,
      ),
      productDate: new Intl.DateTimeFormat(
        intlLocaleTags[locale],
        dateFormatOptions.productDate,
      ),
      weekdayShort: new Intl.DateTimeFormat(
        intlLocaleTags[locale],
        dateFormatOptions.weekdayShort,
      ),
    }),
    [locale],
  );

  const formatDate = useCallback(
    (date: Date, formatKey: DateFormatKey) => {
      return dateFormatters[formatKey].format(date);
    },
    [dateFormatters],
  );

  return useMemo(
    () => ({
      locale,
      isLocaleReady,
      locales: SUPPORTED_LOCALES,
      setLocale,
      t,
      formatDate,
    }),
    [locale, isLocaleReady, setLocale, t, formatDate],
  );
});
