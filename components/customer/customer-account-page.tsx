"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Heart,
  LogOut,
  PackageCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import { getPrimaryProductImage } from "@/lib/catalog/product-images";
import {
  formatPrice,
  getProductDisplayPrice,
  getProductName,
} from "@/lib/catalog/helpers";
import { ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import {
  clearCustomerSession,
  getCustomerSession,
  readCustomerAccounts,
} from "@/lib/customer/auth-storage";
import {
  getCustomerProfileData,
  updateCustomerProfileData,
} from "@/lib/customer/customer-actions";
import {
  CUSTOMER_SAVED_PRODUCTS_EVENT,
  readCustomerSavedProductIds,
  removeSavedProductForCustomer,
} from "@/lib/customer/saved-products";
import { CUSTOMER_SESSION_STORAGE_KEY } from "@/lib/customer/storage";
import type { CustomerCopy } from "@/lib/customer/customer-copy";
import type { Locale } from "@/lib/i18n/config";
import type {
  DeliveryMethod,
  MockOrder,
  MockOrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/cart";
import type { CustomerAccount, CustomerSession } from "@/types/customer";
import type { ProductPreview } from "@/types/store";

type CustomerAccountPageProps = {
  locale: Locale;
  copy: CustomerCopy;
  products: ProductPreview[];
};

const accountCopy = {
  uk: {
    profile: "Профіль покупця",
    profileHint:
      "Ваші контактні дані використовуються для оформлення замовлень і зв'язку щодо доставки.",
    customerId: "ID покупця",
    registered: "Зареєстровано",
    sessionStarted: "Поточна сесія",
    accountReady:
      "Перевіряйте дані перед оформленням замовлення, щоб доставка пройшла без затримок.",
    ordersCount: "Замовлень",
    totalSpent: "Сума покупок",
    lastOrder: "Останнє замовлення",
    noLastOrder: "Поки немає",
    continueShopping: "Перейти до каталогу",
    emptyTitle: "Поки замовлень немає",
    emptyText:
      "Після оформлення покупки ваші замовлення з'являться тут.",
    items: "Товари",
    delivery: "Доставка",
    payment: "Оплата",
    shipments: "Відправлення",
    phone: "Телефон",
    city: "Місто",
    branch: "Відділення",
    deliveryMethod: "Спосіб доставки",
    paymentMethod: "Спосіб оплати",
    paymentStatus: "Статус оплати",
    quantity: "Кількість",
    sku: "SKU",
    ttn: "ТТН",
    address: "Адреса",
    saveProfile: "Зберегти дані",
    profileSaved: "Дані збережено",
    notAssigned: "Не вказано",
  },
  ru: {
    profile: "Профиль покупателя",
    profileHint:
      "Ваши контактные данные используются для оформления заказов и связи по доставке.",
    customerId: "ID покупателя",
    registered: "Зарегистрирован",
    sessionStarted: "Текущая сессия",
    accountReady:
      "Проверяйте данные перед оформлением заказа, чтобы доставка прошла без задержек.",
    ordersCount: "Заказов",
    totalSpent: "Сумма покупок",
    lastOrder: "Последний заказ",
    noLastOrder: "Пока нет",
    continueShopping: "Перейти в каталог",
    emptyTitle: "Пока заказов нет",
    emptyText:
      "После оформления покупки ваши заказы появятся здесь.",
    items: "Товары",
    delivery: "Доставка",
    payment: "Оплата",
    shipments: "Отправления",
    phone: "Телефон",
    city: "Город",
    branch: "Отделение",
    deliveryMethod: "Способ доставки",
    paymentMethod: "Способ оплаты",
    paymentStatus: "Статус оплаты",
    quantity: "Количество",
    sku: "SKU",
    ttn: "ТТН",
    address: "Адрес",
    saveProfile: "Сохранить данные",
    profileSaved: "Данные сохранены",
    notAssigned: "Не указано",
  },
} as const;

const orderStatusLabels: Record<Locale, Record<MockOrderStatus, string>> = {
  uk: {
    new: "Нове",
    confirmed: "Підтверджено",
    paid: "Оплачено",
    packed: "Упаковано",
    shipped: "Відправлено",
    delivered: "Доставлено",
    cancelled: "Скасовано",
    returned: "Повернено",
  },
  ru: {
    new: "Новый",
    confirmed: "Подтвержден",
    paid: "Оплачен",
    packed: "Упакован",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменен",
    returned: "Возвращен",
  },
};

const deliveryMethodLabels: Record<Locale, Record<DeliveryMethod, string>> = {
  uk: {
    nova_poshta: "Нова Пошта",
    ukrposhta: "Укрпошта",
    pickup: "Самовивіз",
  },
  ru: {
    nova_poshta: "Новая Почта",
    ukrposhta: "Укрпочта",
    pickup: "Самовывоз",
  },
};

const paymentMethodLabels: Record<Locale, Record<PaymentMethod, string>> = {
  uk: {
    cash_on_delivery: "Післяплата",
    monopay: "Monopay",
    online_payment: "Онлайн-оплата",
    card_on_delivery: "Карткою при отриманні",
  },
  ru: {
    cash_on_delivery: "Наложенный платеж",
    monopay: "Monopay",
    online_payment: "Онлайн-оплата",
    card_on_delivery: "Картой при получении",
  },
};

const paymentStatusLabels: Record<Locale, Record<PaymentStatus, string>> = {
  uk: {
    pending: "Очікує",
    paid: "Оплачено",
    failed: "Помилка",
    cancelled: "Скасовано",
    refunded: "Повернено",
  },
  ru: {
    pending: "Ожидает",
    paid: "Оплачено",
    failed: "Ошибка",
    cancelled: "Отменено",
    refunded: "Возвращено",
  },
};

const nonRevenueStatuses: MockOrderStatus[] = ["cancelled", "returned"];

export function CustomerAccountPage({
  locale,
  copy,
  products,
}: CustomerAccountPageProps) {
  const localized = accountCopy[locale];
  const savedCopy =
    locale === "uk"
      ? {
          title: "Збережені товари",
          hint: "Товари, до яких зручно повернутися перед наступним замовленням.",
          emptyTitle: "Список поки порожній",
          emptyText: "Натисніть серце на товарі, щоб зберегти його тут.",
          remove: "Прибрати",
          view: "Переглянути",
          cart: "Додати в кошик",
          savedCount: "Збережено",
        }
      : {
          title: "Сохраненные товары",
          hint: "Товары, к которым удобно вернуться перед следующим заказом.",
          emptyTitle: "Список пока пуст",
          emptyText: "Нажмите сердце на товаре, чтобы сохранить его здесь.",
          remove: "Убрать",
          view: "Посмотреть",
          cart: "В корзину",
          savedCount: "Сохранено",
        };
  const [session, setSession] = useState<CustomerSession | null>(() =>
    getCustomerSession(),
  );
  const [account, setAccount] = useState<CustomerAccount | null>(() => {
    const currentSession = getCustomerSession();

    return currentSession ? getAccountForSession(currentSession) : null;
  });
  const [orders, setOrders] = useState<MockOrder[]>(() => {
    const currentSession = getCustomerSession();

    return currentSession ? getOrdersForEmail(currentSession.email) : [];
  });
  const [savedProductIds, setSavedProductIds] = useState<string[]>(() => {
    const currentSession = getCustomerSession();

    return currentSession
      ? readCustomerSavedProductIds(currentSession.customerId)
      : [];
  });
  const [profile, setProfile] = useState({
    phone: "",
    city: "",
    warehouse: "",
    address: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const stats = useMemo(() => getOrderStats(orders), [orders]);
  const savedProducts = useMemo(
    () =>
      savedProductIds
        .map((productId) => products.find((product) => product.id === productId))
        .filter((product): product is ProductPreview => Boolean(product)),
    [products, savedProductIds],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let isMounted = true;

    void getCustomerProfileData(session.customerId, session.email).then((result) => {
      if (!isMounted || !result.ok) {
        return;
      }

      setAccount(result.account);
      setProfile(result.profile);
      setOrders(result.orders);
      setSavedProductIds(readCustomerSavedProductIds(session.customerId));
    });

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const customerId = session.customerId;

    function syncSavedProducts() {
      setSavedProductIds(readCustomerSavedProductIds(customerId));
    }

    syncSavedProducts();
    window.addEventListener(CUSTOMER_SAVED_PRODUCTS_EVENT, syncSavedProducts);
    window.addEventListener("storage", syncSavedProducts);

    return () => {
      window.removeEventListener(
        CUSTOMER_SAVED_PRODUCTS_EVENT,
        syncSavedProducts,
      );
      window.removeEventListener("storage", syncSavedProducts);
    };
  }, [session]);

  function handleLogout() {
    clearCustomerSession();
    setSession(null);
    setAccount(null);
    setOrders([]);
    setSavedProductIds([]);
    setProfile({ phone: "", city: "", warehouse: "", address: "" });
    setProfileMessage("");
  }

  function handleRemoveSavedProduct(productId: string) {
    if (!session) {
      return;
    }

    setSavedProductIds(
      removeSavedProductForCustomer(session.customerId, productId),
    );
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") ?? "").trim() || session.name;
    const nextProfile = {
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      warehouse: String(formData.get("warehouse") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
    };

    await updateCustomerProfileData({
      customerId: session.customerId,
      email: session.email,
      name: nextName,
      ...nextProfile,
    });

    const nextSession = { ...session, name: nextName };
    setSession(nextSession);
    setAccount((currentAccount) =>
      currentAccount
        ? {
            ...currentAccount,
            name: nextName,
            updatedAt: new Date().toISOString(),
          }
        : currentAccount,
    );
    setProfile(nextProfile);
    setProfileMessage(localized.profileSaved);

    try {
      window.localStorage.setItem(
        CUSTOMER_SESSION_STORAGE_KEY,
        JSON.stringify(nextSession),
      );
    } catch {
      // Keeping the visible profile updated is enough when browser storage is unavailable.
    }
  }

  if (!session) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {copy.accountTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {copy.notLoggedIn}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/auth/login?locale=${locale}`}>{copy.login}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/auth/register?locale=${locale}`}>{copy.register}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:gap-8">
      <div className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {copy.accountTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {copy.accountText}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleLogout}>
            <LogOut />
            {copy.logout}
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={localized.ordersCount}
          value={String(orders.length)}
          icon={<ShoppingBag className="size-4" />}
        />
        <Metric
          label={savedCopy.savedCount}
          value={String(savedProducts.length)}
          icon={<Heart className="size-4" />}
        />
        <Metric
          label={localized.totalSpent}
          value={`${formatPrice(stats.totalSpent)} UAH`}
          icon={<CreditCard className="size-4" />}
        />
        <Metric
          label={localized.lastOrder}
          value={
            stats.lastOrder
              ? formatCustomerDate(stats.lastOrder.createdAt, locale)
              : localized.noLastOrder
          }
          icon={<CalendarDays className="size-4" />}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground">
                {localized.profile}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {localized.profileHint}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <InfoRow label={copy.name} value={session.name} />
            <InfoRow label={copy.email} value={session.email} />
            <InfoRow label={localized.customerId} value={session.customerId} />
            <InfoRow
              label={localized.registered}
              value={formatCustomerDate(
                account?.createdAt ?? session.createdAt,
                locale,
              )}
            />
          </div>
          <p className="mt-5 rounded-lg border border-border bg-card px-4 py-3 text-xs leading-5 text-muted-foreground">
            {localized.accountReady}
          </p>
          <form
            key={`${session.customerId}-${profile.phone}-${profile.city}-${profile.warehouse}`}
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={handleProfileSubmit}
          >
            <ProfileField
              label={copy.name}
              name="name"
              defaultValue={account?.name || session.name}
            />
            <ProfileField
              label={localized.phone}
              name="phone"
              defaultValue={profile.phone}
            />
            <ProfileField
              label={localized.city}
              name="city"
              defaultValue={profile.city}
            />
            <ProfileField
              label={localized.branch}
              name="warehouse"
              defaultValue={profile.warehouse}
            />
            <ProfileField
              label={localized.address}
              name="address"
              defaultValue={profile.address}
              className="md:col-span-2"
            />
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <Button type="submit">{localized.saveProfile}</Button>
              {profileMessage ? (
                <span className="text-sm font-semibold text-primary">
                  {profileMessage}
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <SavedProductsPanel
          locale={locale}
          copy={savedCopy}
          products={savedProducts}
          onRemove={handleRemoveSavedProduct}
        />
      </div>

      <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              {copy.orderHistory}
            </h3>
          </div>
        </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/catalog`}>{localized.continueShopping}</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-background p-8 text-center">
              <PackageCheck className="mx-auto size-8 text-primary" />
              <h4 className="mt-4 text-base font-bold text-foreground">
                {localized.emptyTitle}
              </h4>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {localized.emptyText}
              </p>
              <Button asChild className="mt-5">
                <Link href={`/${locale}/catalog`}>
                  {localized.continueShopping}
                </Link>
              </Button>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                locale={locale}
                copy={copy}
                localized={localized}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SavedProductsPanel({
  locale,
  copy,
  products,
  onRemove,
}: {
  locale: Locale;
  copy: {
    title: string;
    hint: string;
    emptyTitle: string;
    emptyText: string;
    remove: string;
    view: string;
    cart: string;
  };
  products: ProductPreview[];
  onRemove: (productId: string) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Heart className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-foreground">{copy.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {copy.hint}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
            <Heart className="mx-auto size-7 text-primary" />
            <h4 className="mt-3 font-bold text-foreground">{copy.emptyTitle}</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.emptyText}
            </p>
          </div>
        ) : (
          products.map((product) => (
            <SavedProductCard
              key={product.id}
              locale={locale}
              copy={copy}
              product={product}
              onRemove={() => onRemove(product.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SavedProductCard({
  locale,
  copy,
  product,
  onRemove,
}: {
  locale: Locale;
  copy: {
    remove: string;
    view: string;
    cart: string;
  };
  product: ProductPreview;
  onRemove: () => void;
}) {
  const productName = getProductName(product, locale);
  const isAvailable = product.status === "active" && product.stock > 0;

  return (
    <article className="grid grid-cols-[86px_1fr] gap-3 rounded-lg border border-border bg-card p-3">
      <Link href={`/${locale}/products/${product.slug}`}>
        <ProductVisual
          tone={product.tone}
          imageUrl={getPrimaryProductImage(product)}
          alt={productName}
          className="aspect-square"
        />
      </Link>
      <div className="min-w-0">
        <Link
          href={`/${locale}/products/${product.slug}`}
          className="line-clamp-2 text-sm font-bold leading-5 text-foreground hover:text-primary"
        >
          {productName}
        </Link>
        <p className="mt-2 text-sm font-bold text-foreground">
          {formatPrice(getProductDisplayPrice(product))} UAH
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <AddToCartButton
            productId={product.id}
            maxQuantity={product.stock}
            label={copy.cart}
            disabled={!isAvailable}
            size="sm"
            className="px-3 text-xs"
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/products/${product.slug}`}>{copy.view}</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={copy.remove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words text-lg font-bold leading-tight text-foreground">
        {value}
      </p>
    </article>
  );
}

function OrderCard({
  order,
  locale,
  copy,
  localized,
}: {
  order: MockOrder;
  locale: Locale;
  copy: CustomerCopy;
  localized: (typeof accountCopy)[Locale];
}) {
  const paymentStatus = order.paymentStatus ?? "pending";

  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold text-foreground">{order.id}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.created}: {formatCustomerDate(order.createdAt, locale)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {orderStatusLabels[locale][order.status]}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <InfoRow
          label={copy.status}
          value={orderStatusLabels[locale][order.status]}
        />
        <InfoRow
          label={copy.total}
          value={`${formatPrice(order.total)} UAH`}
        />
      </div>

      <section className="mt-5 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShoppingBag className="size-4 text-primary" />
          {localized.items}
        </div>
        <div className="mt-3 grid gap-3">
          {order.items.map((item) => (
            <div
              key={`${order.id}-${item.productId}-${item.sku}`}
              className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {locale === "uk" ? item.nameUk : item.nameRu}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {localized.sku}: {item.sku}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-foreground">
                  {formatPrice(item.lineTotal)} UAH
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {localized.quantity}: {item.quantity} x{" "}
                {formatPrice(item.price)} UAH
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <OrderInfoBlock
          title={localized.delivery}
          icon={<Truck className="size-4 text-primary" />}
        >
          <InfoRow label={localized.phone} value={order.phone} />
          <InfoRow label={localized.city} value={order.city} />
          <InfoRow label={localized.branch} value={order.novaPoshtaBranch} />
          <InfoRow
            label={localized.deliveryMethod}
            value={deliveryMethodLabels[locale][order.deliveryMethod]}
          />
        </OrderInfoBlock>
        <OrderInfoBlock
          title={localized.payment}
          icon={<CreditCard className="size-4 text-primary" />}
        >
          <InfoRow
            label={localized.paymentMethod}
            value={paymentMethodLabels[locale][order.paymentMethod]}
          />
          <InfoRow
            label={localized.paymentStatus}
            value={paymentStatusLabels[locale][paymentStatus]}
          />
          <InfoRow
            label={copy.total}
            value={`${formatPrice(order.total)} UAH`}
          />
        </OrderInfoBlock>
      </div>

      {order.shipments && order.shipments.length > 0 ? (
        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <PackageCheck className="size-4 text-primary" />
            {localized.shipments}
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            {order.shipments.map((shipment) => (
              <InfoRow
                key={shipment.id}
                label={shipment.supplierId}
                value={
                  shipment.ttnNumber
                    ? `${localized.ttn}: ${shipment.ttnNumber}`
                    : localized.notAssigned
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function OrderInfoBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </div>
      <div className="mt-3 grid gap-2 text-sm">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-foreground ${className ?? ""}`}>
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-full border border-input bg-background px-4 text-sm font-normal text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function getAccountForSession(session: CustomerSession) {
  const accounts = readCustomerAccounts();

  return (
    accounts.find((account) => account.id === session.customerId) ??
    accounts.find(
      (account) => account.email.toLowerCase() === session.email.toLowerCase(),
    ) ??
    null
  );
}

function getOrdersForEmail(email: string) {
  try {
    const value = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders = value ? (JSON.parse(value) as MockOrder[]) : [];

    if (!Array.isArray(orders)) {
      return [];
    }

    return orders
      .filter((order) => order.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

function getOrderStats(orders: MockOrder[]) {
  return {
    lastOrder: orders[0],
    totalSpent: orders
      .filter((order) => !nonRevenueStatuses.includes(order.status))
      .reduce((total, order) => total + order.total, 0),
  };
}

function formatCustomerDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "ru-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
