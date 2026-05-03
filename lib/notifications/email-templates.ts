import type { Locale } from "@/lib/i18n/config";
import type { DeliveryProvider, MockOrder } from "@/types/cart";

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

type WelcomeEmailInput = {
  name?: string | null;
  email: string;
  locale?: Locale;
  accountUrl?: string;
};

type PasswordResetEmailInput = {
  name?: string | null;
  email: string;
  locale?: Locale;
  resetUrl: string;
  expiresInMinutes: number;
};

type ShipmentEmailInput = {
  orderId: string;
  locale?: Locale;
  ttn: string;
  deliveryProvider: DeliveryProvider;
  trackingUrl?: string;
};

const copy = {
  uk: {
    brand: "Rytm",
    footer:
      "Цей лист надіслано автоматично. Якщо у вас є питання, просто зв'яжіться з підтримкою магазину.",
    openAccount: "Відкрити кабінет",
    resetPassword: "Змінити пароль",
    viewOrder: "Переглянути замовлення",
    orderSubject: (orderId: string) => `Замовлення №${orderId} отримано`,
    orderTitle: (orderId: string) => `Дякуємо за замовлення №${orderId}`,
    orderIntro:
      "Ми отримали ваше замовлення та вже передали його в обробку. Нижче короткі деталі покупки.",
    orderItems: "Товари",
    orderSummary: "Підсумок",
    subtotal: "Сума товарів",
    discount: "Знижка",
    delivery: "Доставка",
    total: "Разом",
    customer: "Отримувач",
    phone: "Телефон",
    email: "Email",
    city: "Місто",
    warehouse: "Відділення / адреса",
    payment: "Оплата",
    welcomeSubject: "Ласкаво просимо до Rytm",
    welcomeTitle: "Ваш акаунт Rytm створено",
    welcomeIntro:
      "Тепер ви можете швидше оформлювати замовлення, переглядати історію покупок та зберігати контактні дані.",
    resetSubject: "Відновлення пароля Rytm",
    resetTitle: "Запит на зміну пароля",
    resetIntro: (minutes: number) =>
      `Натисніть кнопку нижче, щоб створити новий пароль. Посилання діє ${minutes} хвилин.`,
    resetSafety:
      "Якщо ви не надсилали цей запит, просто проігноруйте лист. Пароль не зміниться.",
    shipmentSubject: (orderId: string) =>
      `ТТН для замовлення №${orderId}`,
    shipmentTitle: (orderId: string) =>
      `Ваше замовлення №${orderId} відправлено`,
    shipmentIntro:
      "Ми підготували відправлення. Нижче номер ТТН для відстеження доставки.",
    ttn: "ТТН",
    carrier: "Служба доставки",
    trackPackage: "Відстежити посилку",
    quantity: "Кількість",
  },
  ru: {
    brand: "Rytm",
    footer:
      "Это письмо отправлено автоматически. Если у вас есть вопросы, свяжитесь с поддержкой магазина.",
    openAccount: "Открыть кабинет",
    resetPassword: "Изменить пароль",
    viewOrder: "Посмотреть заказ",
    orderSubject: (orderId: string) => `Заказ №${orderId} получен`,
    orderTitle: (orderId: string) => `Спасибо за заказ №${orderId}`,
    orderIntro:
      "Мы получили ваш заказ и уже передали его в обработку. Ниже краткие детали покупки.",
    orderItems: "Товары",
    orderSummary: "Итог",
    subtotal: "Сумма товаров",
    discount: "Скидка",
    delivery: "Доставка",
    total: "Итого",
    customer: "Получатель",
    phone: "Телефон",
    email: "Email",
    city: "Город",
    warehouse: "Отделение / адрес",
    payment: "Оплата",
    welcomeSubject: "Добро пожаловать в Rytm",
    welcomeTitle: "Ваш аккаунт Rytm создан",
    welcomeIntro:
      "Теперь вы можете быстрее оформлять заказы, смотреть историю покупок и сохранять контактные данные.",
    resetSubject: "Восстановление пароля Rytm",
    resetTitle: "Запрос на изменение пароля",
    resetIntro: (minutes: number) =>
      `Нажмите кнопку ниже, чтобы создать новый пароль. Ссылка действует ${minutes} минут.`,
    resetSafety:
      "Если вы не отправляли этот запрос, просто проигнорируйте письмо. Пароль не изменится.",
    shipmentSubject: (orderId: string) => `ТТН для заказа №${orderId}`,
    shipmentTitle: (orderId: string) => `Ваш заказ №${orderId} отправлен`,
    shipmentIntro:
      "Мы подготовили отправление. Ниже номер ТТН для отслеживания доставки.",
    ttn: "ТТН",
    carrier: "Служба доставки",
    trackPackage: "Отследить посылку",
    quantity: "Количество",
  },
} as const;

const deliveryProviderLabels: Record<DeliveryProvider, Record<Locale, string>> = {
  nova_poshta: { uk: "Нова пошта", ru: "Новая почта" },
  ukrposhta: { uk: "Укрпошта", ru: "Укрпочта" },
  pickup: { uk: "Самовивіз", ru: "Самовывоз" },
  other: { uk: "Служба доставки", ru: "Служба доставки" },
};

const paymentLabels: Record<string, Record<Locale, string>> = {
  cash_on_delivery: { uk: "Оплата при отриманні", ru: "Оплата при получении" },
  card_on_delivery: { uk: "Карткою при отриманні", ru: "Картой при получении" },
  liqpay: { uk: "Онлайн LiqPay", ru: "Онлайн LiqPay" },
  online_payment: { uk: "Онлайн оплата", ru: "Онлайн оплата" },
};

export function buildOrderConfirmationEmail(order: MockOrder): EmailTemplate {
  const locale = getTemplateLocale(order.locale);
  const c = copy[locale];
  const itemRows = order.items
    .map((item) =>
      itemRow({
        name: locale === "ru" ? item.nameRu : item.nameUk,
        detail: [item.variantLabelUk, item.variantSku || item.sku]
          .filter(Boolean)
          .join(" / "),
        quantity: item.quantity,
        total: formatMoney(item.lineTotal),
        quantityLabel: c.quantity,
      }),
    )
    .join("");
  const summaryRows = [
    summaryRow(c.subtotal, formatMoney(order.subtotal)),
    order.discountTotal && order.discountTotal > 0
      ? summaryRow(c.discount, `-${formatMoney(order.discountTotal)}`)
      : "",
    summaryRow(c.delivery, formatMoney(order.deliveryPrice)),
    summaryRow(c.total, formatMoney(order.total), true),
  ].join("");
  const details = [
    infoBlock(c.customer, order.customerName),
    infoBlock(c.phone, order.phone),
    infoBlock(c.email, order.email),
    infoBlock(c.city, order.city),
    infoBlock(c.warehouse, order.novaPoshtaBranch),
    infoBlock(c.payment, getPaymentLabel(order.paymentMethod, locale)),
  ].join("");
  const html = layout({
    locale,
    title: c.orderTitle(order.id),
    intro: c.orderIntro,
    preheader: c.orderSubject(order.id),
    children: `
      ${section(c.orderItems, `<div>${itemRows}</div>`)}
      ${section(c.orderSummary, `<table role="presentation" style="width:100%;border-collapse:collapse">${summaryRows}</table>`)}
      ${section(c.customer, `<div style="display:grid;gap:10px">${details}</div>`)}
    `,
  });
  const text = [
    c.orderTitle(order.id),
    "",
    c.orderIntro,
    "",
    ...order.items.map(
      (item) =>
        `- ${locale === "ru" ? item.nameRu : item.nameUk} x ${item.quantity}: ${formatMoney(item.lineTotal)}`,
    ),
    "",
    `${c.subtotal}: ${formatMoney(order.subtotal)}`,
    order.discountTotal && order.discountTotal > 0
      ? `${c.discount}: -${formatMoney(order.discountTotal)}`
      : "",
    `${c.delivery}: ${formatMoney(order.deliveryPrice)}`,
    `${c.total}: ${formatMoney(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: c.orderSubject(order.id),
    text,
    html,
  };
}

export function buildWelcomeEmail({
  name,
  email,
  locale = "uk",
  accountUrl,
}: WelcomeEmailInput): EmailTemplate {
  const safeLocale = getTemplateLocale(locale);
  const c = copy[safeLocale];
  const title = name?.trim()
    ? `${c.welcomeTitle}, ${name.trim()}`
    : c.welcomeTitle;
  const html = layout({
    locale: safeLocale,
    title,
    intro: c.welcomeIntro,
    preheader: c.welcomeSubject,
    action: accountUrl
      ? { label: c.openAccount, url: accountUrl }
      : undefined,
    children: section(c.email, infoBlock(c.email, email)),
  });

  return {
    subject: c.welcomeSubject,
    text: [title, "", c.welcomeIntro, "", email, accountUrl ?? ""]
      .filter(Boolean)
      .join("\n"),
    html,
  };
}

export function buildPasswordResetEmail({
  name,
  email,
  locale = "uk",
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): EmailTemplate {
  const safeLocale = getTemplateLocale(locale);
  const c = copy[safeLocale];
  const intro = c.resetIntro(expiresInMinutes);
  const html = layout({
    locale: safeLocale,
    title: name?.trim() ? `${c.resetTitle}, ${name.trim()}` : c.resetTitle,
    intro,
    preheader: c.resetSubject,
    action: { label: c.resetPassword, url: resetUrl },
    children: `
      ${section(c.email, infoBlock(c.email, email))}
      <p style="margin:18px 0 0;color:#7b6258;font-size:14px;line-height:22px">${escapeHtml(c.resetSafety)}</p>
    `,
  });

  return {
    subject: c.resetSubject,
    text: [c.resetTitle, "", intro, "", resetUrl, "", c.resetSafety].join("\n"),
    html,
  };
}

export function buildShipmentTtnEmail({
  orderId,
  locale = "uk",
  ttn,
  deliveryProvider,
  trackingUrl,
}: ShipmentEmailInput): EmailTemplate {
  const safeLocale = getTemplateLocale(locale);
  const c = copy[safeLocale];
  const providerLabel = deliveryProviderLabels[deliveryProvider][safeLocale];
  const html = layout({
    locale: safeLocale,
    title: c.shipmentTitle(orderId),
    intro: c.shipmentIntro,
    preheader: c.shipmentSubject(orderId),
    action: trackingUrl
      ? { label: c.trackPackage, url: trackingUrl }
      : undefined,
    children: section(
      c.ttn,
      `
        ${infoBlock(c.carrier, providerLabel)}
        ${infoBlock(c.ttn, ttn)}
      `,
    ),
  });

  return {
    subject: c.shipmentSubject(orderId),
    text: [
      c.shipmentTitle(orderId),
      "",
      c.shipmentIntro,
      `${c.carrier}: ${providerLabel}`,
      `${c.ttn}: ${ttn}`,
      trackingUrl ?? "",
    ]
      .filter(Boolean)
      .join("\n"),
    html,
  };
}

function layout({
  locale,
  title,
  intro,
  preheader,
  children,
  action,
}: {
  locale: Locale;
  title: string;
  intro: string;
  preheader: string;
  children: string;
  action?: { label: string; url: string };
}) {
  const c = copy[locale];

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f7f0e8;color:#1f1a17;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
    <table role="presentation" style="width:100%;border-collapse:collapse;background:#f7f0e8">
      <tr>
        <td style="padding:32px 16px">
          <table role="presentation" style="width:100%;max-width:640px;margin:0 auto;border-collapse:collapse">
            <tr>
              <td style="padding:0 0 18px">
                <div style="font-size:24px;font-weight:800;letter-spacing:0;color:#a96154">${escapeHtml(c.brand)}</div>
              </td>
            </tr>
            <tr>
              <td style="overflow:hidden;border:1px solid #e4d2c3;border-radius:18px;background:#fffaf5;box-shadow:0 12px 36px rgba(72,48,36,.08)">
                <div style="background:#a96154;padding:28px;color:#fff">
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.82">${escapeHtml(c.brand)}</p>
                  <h1 style="margin:0;font-size:28px;line-height:34px;font-weight:800">${escapeHtml(title)}</h1>
                </div>
                <div style="padding:28px">
                  <p style="margin:0;color:#6f554d;font-size:16px;line-height:26px">${escapeHtml(intro)}</p>
                  ${action ? button(action.label, action.url) : ""}
                  <div style="margin-top:24px">${children}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 4px 0;color:#8a7066;font-size:12px;line-height:18px">
                ${escapeHtml(c.footer)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function section(title: string, children: string) {
  return `
    <div style="margin-top:18px;border:1px solid #eadbcc;border-radius:14px;background:#fff;padding:18px">
      <h2 style="margin:0 0 14px;color:#1f1a17;font-size:17px;line-height:24px">${escapeHtml(title)}</h2>
      ${children}
    </div>
  `;
}

function itemRow({
  name,
  detail,
  quantity,
  total,
  quantityLabel,
}: {
  name: string;
  detail: string;
  quantity: number;
  total: string;
  quantityLabel: string;
}) {
  return `
    <div style="padding:14px 0;border-top:1px solid #f0e4d8">
      <table role="presentation" style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding-right:12px">
            <div style="font-size:15px;line-height:21px;font-weight:700;color:#1f1a17">${escapeHtml(name)}</div>
            <div style="margin-top:4px;font-size:12px;line-height:18px;color:#8a7066">${escapeHtml(detail)}</div>
            <div style="margin-top:4px;font-size:12px;line-height:18px;color:#8a7066">${escapeHtml(quantityLabel)}: ${quantity}</div>
          </td>
          <td style="width:110px;text-align:right;font-size:15px;font-weight:800;color:#1f1a17">${escapeHtml(total)}</td>
        </tr>
      </table>
    </div>
  `;
}

function summaryRow(label: string, value: string, strong = false) {
  return `
    <tr>
      <td style="padding:8px 0;color:#7b6258;font-size:14px">${escapeHtml(label)}</td>
      <td style="padding:8px 0;text-align:right;color:#1f1a17;font-size:${strong ? "18px" : "14px"};font-weight:${strong ? "800" : "700"}">${escapeHtml(value)}</td>
    </tr>
  `;
}

function infoBlock(label: string, value: string) {
  return `
    <div style="border-radius:12px;background:#f8f1ea;padding:12px">
      <div style="font-size:12px;line-height:18px;color:#8a7066">${escapeHtml(label)}</div>
      <div style="margin-top:3px;font-size:15px;line-height:22px;font-weight:700;color:#1f1a17">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

function button(label: string, url: string) {
  return `
    <div style="margin-top:24px">
      <a href="${escapeAttribute(url)}" style="display:inline-block;border-radius:999px;background:#a96154;padding:13px 22px;color:#fff;font-size:14px;font-weight:800;text-decoration:none">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

function getPaymentLabel(value: string, locale: Locale) {
  return paymentLabels[value]?.[locale] ?? value;
}

function getTemplateLocale(locale: Locale | undefined): Locale {
  return locale === "ru" ? "ru" : "uk";
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(value)} ₴`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
