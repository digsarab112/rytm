"use client";

import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import { useStorefrontConfig } from "@/components/storefront/storefront-config-provider";
import { formatPrice } from "@/lib/catalog/helpers";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export type PublicInfoPageKind =
  | "delivery-payment"
  | "contact"
  | "privacy-policy"
  | "terms"
  | "return-policy";

type ConfigurableInfoPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  kind: PublicInfoPageKind;
};

const copy: Record<
  Locale,
  {
    deliveryTitle: string;
    deliverySubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
    privacyTitle: string;
    privacySubtitle: string;
    termsTitle: string;
    termsSubtitle: string;
    returnsTitle: string;
    returnsSubtitle: string;
    deliveryMethods: string;
    paymentMethods: string;
    customerSupport: string;
    configuredMethods: string;
    onlinePayment: string;
    cash: string;
    deliveryCost: string;
    freeDelivery: string;
    freeDeliveryFrom: string;
    novaPoshta: string;
    ukrposhta: string;
    phone: string;
    email: string;
    social: string;
    catalog: string;
    legalNotice: string;
    privacyItems: string[];
    termsItems: string[];
    returnsItems: string[];
  }
> = {
  uk: {
    deliveryTitle: "Доставка та оплата",
    deliverySubtitle:
      "Актуальні способи доставки й оплати для замовлень Rytm по Україні.",
    contactTitle: "Контакти",
    contactSubtitle:
      "Зв'яжіться з Rytm щодо замовлення, товарів, доставки або співпраці.",
    privacyTitle: "Політика конфіденційності",
    privacySubtitle:
      "Короткий опис того, як магазин працює з даними клієнтів.",
    termsTitle: "Умови користування",
    termsSubtitle:
      "Базові умови користування сайтом, каталогом і оформленням замовлень.",
    returnsTitle: "Повернення",
    returnsSubtitle:
      "Підхід до повернень і уточнення деталей після обробки замовлення.",
    deliveryMethods: "Способи доставки",
    paymentMethods: "Способи оплати",
    customerSupport: "Підтримка",
    configuredMethods: "Увімкнені методи",
    onlinePayment: "Онлайн-оплата",
    cash: "Післяплата",
    deliveryCost: "Вартість доставки",
    freeDelivery: "Безкоштовна доставка",
    freeDeliveryFrom: "Безкоштовно від",
    novaPoshta: "Нова Пошта",
    ukrposhta: "Укрпошта",
    phone: "Телефон",
    email: "Email",
    social: "Соціальні мережі",
    catalog: "Перейти до каталогу",
    legalNotice:
      "Цей текст підготовлений як стартова сторінка для запуску. Перед публічним юридичним використанням його варто узгодити з юристом.",
    privacyItems: [
      "Ми використовуємо контактні дані для оформлення замовлення, зв'язку з клієнтом і передачі деталей доставки.",
      "Дані доставки можуть передаватися постачальнику, якщо він відправляє товар напряму покупцю.",
      "Платіжні ключі та приватні інтеграції зберігаються тільки на сервері й не показуються клієнтським компонентам.",
    ],
    termsItems: [
      "Інформація в каталозі, ціни та наявність можуть уточнюватися під час обробки замовлення.",
      "Замовлення передається в роботу після отримання контактних даних і підтвердження способу оплати.",
      "Постачальник може створювати TTN і відправляти товар напряму клієнту в dropshipping-сценарії.",
    ],
    returnsItems: [
      "Питання повернення розглядаються індивідуально з урахуванням стану товару, категорії та вимог законодавства.",
      "Зверніться до підтримки з номером замовлення, фото товару й коротким описом ситуації.",
      "Для товарів, які відправляє постачальник, Rytm координує звернення між клієнтом і постачальником.",
    ],
  },
  ru: {
    deliveryTitle: "Доставка и оплата",
    deliverySubtitle:
      "Актуальные способы доставки и оплаты для заказов Rytm по Украине.",
    contactTitle: "Контакты",
    contactSubtitle:
      "Свяжитесь с Rytm по вопросам заказа, товаров, доставки или сотрудничества.",
    privacyTitle: "Политика конфиденциальности",
    privacySubtitle:
      "Краткое описание того, как магазин работает с данными клиентов.",
    termsTitle: "Условия использования",
    termsSubtitle:
      "Базовые условия использования сайта, каталога и оформления заказов.",
    returnsTitle: "Возврат",
    returnsSubtitle:
      "Подход к возвратам и уточнению деталей после обработки заказа.",
    deliveryMethods: "Способы доставки",
    paymentMethods: "Способы оплаты",
    customerSupport: "Поддержка",
    configuredMethods: "Включенные методы",
    onlinePayment: "Онлайн-оплата",
    cash: "Наложенный платеж",
    deliveryCost: "Стоимость доставки",
    freeDelivery: "Бесплатная доставка",
    freeDeliveryFrom: "Бесплатно от",
    novaPoshta: "Новая Почта",
    ukrposhta: "Укрпочта",
    phone: "Телефон",
    email: "Email",
    social: "Социальные сети",
    catalog: "Перейти в каталог",
    legalNotice:
      "Этот текст подготовлен как стартовая страница для запуска. Перед публичным юридическим использованием его стоит согласовать с юристом.",
    privacyItems: [
      "Мы используем контактные данные для оформления заказа, связи с клиентом и передачи деталей доставки.",
      "Данные доставки могут передаваться поставщику, если он отправляет товар напрямую покупателю.",
      "Платежные ключи и приватные интеграции хранятся только на сервере и не показываются клиентским компонентам.",
    ],
    termsItems: [
      "Информация в каталоге, цены и наличие могут уточняться во время обработки заказа.",
      "Заказ передается в работу после получения контактных данных и подтверждения способа оплаты.",
      "Поставщик может создавать TTN и отправлять товар напрямую клиенту в dropshipping-сценарии.",
    ],
    returnsItems: [
      "Вопросы возврата рассматриваются индивидуально с учетом состояния товара, категории и требований законодательства.",
      "Обратитесь в поддержку с номером заказа, фото товара и кратким описанием ситуации.",
      "Для товаров, которые отправляет поставщик, Rytm координирует обращение между клиентом и поставщиком.",
    ],
  },
};

export function ConfigurableInfoPage({
  locale,
  dictionary,
  kind,
}: ConfigurableInfoPageProps) {
  const config = useStorefrontConfig();
  const localizedCopy = copy[locale];
  const title = getPageTitle(kind, localizedCopy);
  const subtitle = getPageSubtitle(kind, localizedCopy);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {config.settings.storeName}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <VisualMedia
            imageUrl={config.settings.visuals?.sectionImage}
            label={title}
            tone="cream"
            className="aspect-[16/9] rounded-lg border border-white/60 shadow-sm"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {kind === "delivery-payment" ? (
          <DeliveryPaymentContent locale={locale} />
        ) : null}
        {kind === "contact" ? <ContactContent locale={locale} /> : null}
        {kind === "privacy-policy" ? (
          <LegalContent items={localizedCopy.privacyItems} />
        ) : null}
        {kind === "terms" ? (
          <LegalContent items={localizedCopy.termsItems} />
        ) : null}
        {kind === "return-policy" ? (
          <LegalContent items={localizedCopy.returnsItems} />
        ) : null}
        <div className="mt-8">
          <Button asChild>
            <Link href={`/${locale}/catalog`}>
              {localizedCopy.catalog} · {dictionary.navigation.catalog}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );

  function DeliveryPaymentContent({ locale }: { locale: Locale }) {
    const settings = config.deliveryPayment;
    const methods = [
      settings.novaPoshtaEnabled ? localizedCopy.novaPoshta : undefined,
      settings.ukrposhtaEnabled ? localizedCopy.ukrposhta : undefined,
    ].filter(isString);
    const deliveryPricePills = [
      settings.deliveryPrice > 0
        ? `${localizedCopy.deliveryCost}: ${formatPrice(settings.deliveryPrice)} ${dictionary.common.currency}`
        : localizedCopy.freeDelivery,
      settings.freeDeliveryThreshold > 0
        ? `${localizedCopy.freeDeliveryFrom}: ${formatPrice(settings.freeDeliveryThreshold)} ${dictionary.common.currency}`
        : undefined,
    ].filter(isString);
    const payments = [
      settings.onlinePaymentEnabled ? localizedCopy.onlinePayment : undefined,
      settings.cashOnDeliveryEnabled ? localizedCopy.cash : undefined,
    ].filter(isString);
    const deliveryText =
      locale === "uk" ? settings.deliveryTextUk : settings.deliveryTextRu;
    const paymentText =
      locale === "uk" ? settings.paymentTextUk : settings.paymentTextRu;

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard
          icon={Truck}
          title={localizedCopy.deliveryMethods}
          body={filterPickupText(deliveryText)}
          pills={[...methods, ...deliveryPricePills]}
        />
        <InfoCard
          icon={ShieldCheck}
          title={localizedCopy.paymentMethods}
          body={filterPickupText(paymentText)}
          pills={payments}
        />
      </div>
    );
  }

  function ContactContent({ locale }: { locale: Locale }) {
    const { settings } = config;
    const socialLinks = settings.socialLinks
      ? Object.entries(settings.socialLinks).filter(([, value]) => value)
      : [];

    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <ContactCard
          icon={Phone}
          title={localizedCopy.phone}
          href={`tel:${settings.contactPhone.replaceAll(" ", "")}`}
          value={settings.contactPhone}
        />
        <ContactCard
          icon={Mail}
          title={localizedCopy.email}
          href={`mailto:${settings.contactEmail}`}
          value={settings.contactEmail}
        />
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <MessageCircle className="size-6 text-primary" />
          <h2 className="mt-5 text-lg font-bold text-foreground">
            {localizedCopy.social}
          </h2>
          <div className="mt-4 grid gap-2 text-sm font-semibold text-foreground">
            {socialLinks.length > 0 ? (
              socialLinks.map(([name, href]) => (
                <Link key={name} href={href ?? "#"} className="hover:text-primary">
                  {name}
                </Link>
              ))
            ) : (
              <span>{settings.description[locale]}</span>
            )}
          </div>
        </article>
      </div>
    );
  }
}

function InfoCard({
  icon: Icon,
  title,
  body,
  pills,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  pills: string[];
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <Icon className="size-6 text-primary" />
      <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        {body}
      </div>
      {pills.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
            >
              {pill}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ContactCard({
  icon: Icon,
  title,
  href,
  value,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  value: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <Icon className="size-6 text-primary" />
      <h2 className="mt-5 text-lg font-bold text-foreground">{title}</h2>
      <Link
        href={href}
        className="mt-4 block text-sm font-semibold text-foreground hover:text-primary"
      >
        {value}
      </Link>
    </article>
  );
}

function LegalContent({ items }: { items: string[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item, index) => (
        <article
          key={item}
          className="rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{item}</p>
        </article>
      ))}
    </div>
  );
}

function filterPickupText(value: string) {
  return value
    .split(/\n+/)
    .filter((line) => !/pickup|самовив|самовывоз|самовивіз/i.test(line))
    .join("\n\n")
    .trim();
}

function isString(value: string | undefined): value is string {
  return Boolean(value);
}

function getPageTitle(
  kind: PublicInfoPageKind,
  localizedCopy: (typeof copy)[Locale],
) {
  if (kind === "delivery-payment") {
    return localizedCopy.deliveryTitle;
  }

  if (kind === "contact") {
    return localizedCopy.contactTitle;
  }

  if (kind === "privacy-policy") {
    return localizedCopy.privacyTitle;
  }

  if (kind === "terms") {
    return localizedCopy.termsTitle;
  }

  return localizedCopy.returnsTitle;
}

function getPageSubtitle(
  kind: PublicInfoPageKind,
  localizedCopy: (typeof copy)[Locale],
) {
  if (kind === "delivery-payment") {
    return localizedCopy.deliverySubtitle;
  }

  if (kind === "contact") {
    return localizedCopy.contactSubtitle;
  }

  if (kind === "privacy-policy") {
    return localizedCopy.privacySubtitle;
  }

  if (kind === "terms") {
    return localizedCopy.termsSubtitle;
  }

  return localizedCopy.returnsSubtitle;
}
