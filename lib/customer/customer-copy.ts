import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

export const customerCopy = {
  uk: {
    account: "Кабінет",
    login: "Вхід",
    register: "Реєстрація",
    logout: "Вийти",
    backToStore: "Повернутися до магазину",
    name: "Ім'я",
    email: "Email",
    password: "Пароль",
    createAccount: "Створити акаунт",
    signIn: "Увійти",
    noAccount: "Ще немає акаунта?",
    hasAccount: "Вже маєте акаунт?",
    goToRegister: "Зареєструватися",
    goToLogin: "Увійти",
    loginTitle: "Вхід до кабінету",
    loginText: "Увійдіть, щоб переглядати дані акаунта та історію замовлень.",
    registerTitle: "Створити акаунт Rytm",
    registerText:
      "Створіть акаунт, щоб швидше оформлювати замовлення та переглядати історію покупок.",
    accountTitle: "Мій кабінет",
    accountText:
      "Керуйте своїми замовленнями, контактними даними та історією покупок в одному місці.",
    notLoggedIn: "Увійдіть або зареєструйтеся, щоб відкрити кабінет.",
    orderHistory: "Історія замовлень",
    noOrders: "Замовлень для цього email поки немає.",
    created: "Створено",
    status: "Статус",
    total: "Разом",
    invalid: "Перевірте email і пароль.",
    missing: "Користувача з таким email не знайдено.",
    exists: "Користувач з таким email вже існує.",
    weak: "Пароль має містити щонайменше 6 символів.",
    required: "Заповніть усі поля.",
    signedInAs: "Ви увійшли як",
    localMode:
      "Керуйте профілем, замовленнями та покупками у зручному кабінеті Rytm.",
  },
  ru: {
    account: "Кабинет",
    login: "Вход",
    register: "Регистрация",
    logout: "Выйти",
    backToStore: "Вернуться в магазин",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    createAccount: "Создать аккаунт",
    signIn: "Войти",
    noAccount: "Еще нет аккаунта?",
    hasAccount: "Уже есть аккаунт?",
    goToRegister: "Зарегистрироваться",
    goToLogin: "Войти",
    loginTitle: "Вход в кабинет",
    loginText: "Войдите, чтобы смотреть данные аккаунта и историю заказов.",
    registerTitle: "Создать аккаунт Rytm",
    registerText:
      "Создайте аккаунт, чтобы быстрее оформлять заказы и просматривать историю покупок.",
    accountTitle: "Мой кабинет",
    accountText:
      "Управляйте своими заказами, контактными данными и историей покупок в одном месте.",
    notLoggedIn: "Войдите или зарегистрируйтесь, чтобы открыть кабинет.",
    orderHistory: "История заказов",
    noOrders: "Заказов для этого email пока нет.",
    created: "Создан",
    status: "Статус",
    total: "Итого",
    invalid: "Проверьте email и пароль.",
    missing: "Пользователь с таким email не найден.",
    exists: "Пользователь с таким email уже существует.",
    weak: "Пароль должен содержать минимум 6 символов.",
    required: "Заполните все поля.",
    signedInAs: "Вы вошли как",
    localMode:
      "Управляйте профилем, заказами и покупками в удобном кабинете Rytm.",
  },
} as const;

export type CustomerCopy = (typeof customerCopy)[Locale];

export function getCustomerCopy(locale: Locale) {
  return customerCopy[locale];
}

export function getCustomerLocale(value: string | string[] | undefined): Locale {
  const locale = Array.isArray(value) ? value[0] : value;

  return locale && isLocale(locale) ? locale : defaultLocale;
}
