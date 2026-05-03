"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { DeliveryLocationFields } from "@/components/checkout/delivery-location-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/catalog/helpers";
import {
  getCartLines,
  getCartSubtotal,
  getDeliveryPrice,
} from "@/lib/cart/helpers";
import { createMockOrderId, ORDERS_STORAGE_KEY } from "@/lib/cart/storage";
import { createCheckoutOrder } from "@/lib/checkout/order-actions";
import { getCustomerSession } from "@/lib/customer/auth-storage";
import { getCustomerProfileData } from "@/lib/customer/customer-actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import type { DeliveryPaymentSettings } from "@/types/admin";
import type { Coupon } from "@/types/admin";
import type {
  DeliveryMethod,
  MockOrder,
  MockOrderItem,
  PaymentMethod,
  Shipment,
} from "@/types/cart";
import type { ProductPreview } from "@/types/store";

type CheckoutPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  products: ProductPreview[];
  deliveryPayment: DeliveryPaymentSettings;
  coupons?: Coupon[];
};

export function CheckoutPage({
  locale,
  dictionary,
  products,
  deliveryPayment,
  coupons = [],
}: CheckoutPageProps) {
  const router = useRouter();
  const { items, clearCart, isReady } = useCart();
  const [error, setError] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("nova_poshta");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("liqpay");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponTone, setCouponTone] = useState<"success" | "error">("success");
  const [profileDefaults, setProfileDefaults] = useState(
    getInitialProfileDefaults,
  );

  useEffect(() => {
    let isMounted = true;
    const session = getCustomerSession();

    if (!session) {
      return;
    }

    void getCustomerProfileData(session.customerId, session.email).then((result) => {
      if (!isMounted || !result.ok) {
        return;
      }

      setProfileDefaults({
        customerName: result.account.name || session.name,
        phone: result.profile.phone,
        email: result.account.email,
        city: result.profile.city,
        novaPoshtaBranch: result.profile.warehouse,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const lines = useMemo(
    () => getCartLines(items, products, locale),
    [items, locale, products],
  );
  const subtotal = getCartSubtotal(lines);
  const deliveryMethodOptions = useMemo(
    () => getDeliveryMethodOptions(deliveryPayment, dictionary),
    [deliveryPayment, dictionary],
  );
  const paymentMethodOptions = useMemo(
    () => getPaymentMethodOptions(deliveryPayment, dictionary),
    [deliveryPayment, dictionary],
  );
  const selectedDeliveryMethod = getSelectedOptionValue(
    deliveryMethod,
    deliveryMethodOptions,
  );
  const selectedPaymentMethod = getSelectedOptionValue(
    paymentMethod,
    paymentMethodOptions,
  );
  const appliedCoupon = getActiveCoupon(appliedCouponCode, coupons);
  const discountTotal = appliedCoupon
    ? getCouponDiscount(appliedCoupon, subtotal)
    : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountTotal);
  const needsDeliveryAddress =
    Boolean(selectedDeliveryMethod) && selectedDeliveryMethod !== "pickup";
  const deliveryPrice =
    selectedDeliveryMethod && selectedDeliveryMethod !== "pickup"
      ? getDeliveryPrice(discountedSubtotal, deliveryPayment)
      : 0;
  const total = discountedSubtotal + deliveryPrice;
  const couponCopy = getCouponCopy(locale);
  const unavailableDeliveryText =
    locale === "uk"
      ? "Немає активних способів доставки. Увімкніть хоча б один спосіб в адмін-панелі."
      : "Нет активных способов доставки. Включите хотя бы один способ в админ-панели.";
  const unavailablePaymentText =
    locale === "uk"
      ? "Немає активних способів оплати. Увімкніть хоча б один спосіб в адмін-панелі."
      : "Нет активных способов оплаты. Включите хотя бы один способ в админ-панели.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (lines.length === 0) {
      setError(dictionary.checkout.emptyCart);
      return;
    }

    const activeDeliveryMethod = selectedDeliveryMethod;
    const activePaymentMethod = selectedPaymentMethod;

    if (!activeDeliveryMethod || !activePaymentMethod) {
      setError(
        !activeDeliveryMethod ? unavailableDeliveryText : unavailablePaymentText,
      );
      return;
    }

    const activeNeedsDeliveryAddress = activeDeliveryMethod !== "pickup";
    const customerName = String(formData.get("customerName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const city = activeNeedsDeliveryAddress
      ? String(formData.get("city") ?? "").trim()
      : dictionary.checkout.pickup;
    const novaPoshtaBranch = activeNeedsDeliveryAddress
      ? String(formData.get("novaPoshtaBranch") ?? "").trim()
      : dictionary.checkout.pickup;

    if (
      !customerName ||
      !phone ||
      !email ||
      (activeNeedsDeliveryAddress && (!city || !novaPoshtaBranch))
    ) {
      setError(dictionary.checkout.required);
      return;
    }

    const now = new Date().toISOString();
    const orderId = createMockOrderId();
    const orderItems: MockOrderItem[] = lines.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      const variant = product?.variants?.find(
        (item) => item.id === line.variantId,
      );

      return {
        productId: line.productId,
        variantId: line.variantId,
        nameUk: product?.nameUk ?? line.name,
        nameRu: product?.nameRu ?? line.name,
        sku: line.sku,
        variantLabelUk: variant?.labelUk,
        variantLabelRu: variant?.labelRu,
        variantSku: variant?.sku,
        supplierId: product?.supplierId,
        supplierName: product?.supplierName,
        price: line.salePrice ?? line.price,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      };
    });

    const order: MockOrder = {
      id: orderId,
      customerName,
      phone,
      email,
      city,
      novaPoshtaBranch,
      deliveryMethod: activeDeliveryMethod,
      paymentMethod: activePaymentMethod,
      paymentProvider: getPaymentProvider(activePaymentMethod),
      paymentStatus: "pending",
      paymentId:
        activePaymentMethod === "liqpay"
          ? `liqpay-${orderId}`
          : undefined,
      paymentAmount: total,
      paymentCurrency: "UAH",
      paymentRawResponse:
        activePaymentMethod === "liqpay"
          ? "LiqPay payment request created."
          : "Manual payment flow.",
      status: "new",
      subtotal,
      discountTotal,
      couponCode: appliedCoupon && discountTotal > 0 ? appliedCoupon.code : undefined,
      deliveryPrice,
      total,
      comment: String(formData.get("comment") ?? "").trim(),
      items: orderItems,
      shipments: createInitialShipments(
        orderId,
        orderItems,
        activeDeliveryMethod,
        now,
      ),
      locale,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const savedOrder = await createCheckoutOrder({
        order,
        session: getCustomerSession(),
      });
      const orderForStorage = savedOrder.order ?? order;
      const existingOrders = JSON.parse(
        window.localStorage.getItem(ORDERS_STORAGE_KEY) ?? "[]",
      ) as MockOrder[];

      window.localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify([
          orderForStorage,
          ...existingOrders.filter((item) => item.id !== orderForStorage.id),
        ]),
      );
      clearCart();
      router.push(`/${locale}/order-success?order=${orderForStorage.id}`);
    } catch {
      setError(dictionary.checkout.required);
    }
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#f7ece2]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Rytm
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground">
            {dictionary.checkout.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {dictionary.checkout.subtitle}
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {!isReady ? (
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="h-6 w-52 rounded-full bg-muted" />
            <div className="mt-5 grid gap-4">
              <div className="h-24 rounded-lg bg-muted" />
              <div className="h-24 rounded-lg bg-muted" />
              <div className="h-24 rounded-lg bg-muted" />
            </div>
          </div>
        ) : lines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-foreground">
              {dictionary.cart.emptyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {dictionary.checkout.emptyCart}
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}/catalog`}>
                {dictionary.actions.continueShopping}
              </Link>
            </Button>
          </div>
        ) : (
          <form
            key={`${profileDefaults.email}-${profileDefaults.phone}-${profileDefaults.city}`}
            className="grid gap-5"
            onSubmit={handleSubmit}
          >
            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-card p-4 text-sm font-semibold text-primary">
                <AlertCircle className="size-4" />
                {error}
              </div>
            ) : null}
            <FormSection title={dictionary.checkout.customerInfo}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label={dictionary.checkout.name}
                  name="customerName"
                  defaultValue={profileDefaults.customerName}
                  required
                />
                <Field
                  label={dictionary.checkout.phone}
                  name="phone"
                  defaultValue={profileDefaults.phone}
                  required
                />
                <Field
                  label={dictionary.checkout.email}
                  name="email"
                  type="email"
                  defaultValue={profileDefaults.email}
                  required
                />
              </div>
            </FormSection>
            <FormSection title={dictionary.checkout.deliveryInfo}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  {dictionary.checkout.deliveryMethod}
                  <select
                    name="deliveryMethod"
                    value={selectedDeliveryMethod ?? ""}
                    disabled={deliveryMethodOptions.length === 0}
                    onChange={(event) =>
                      setDeliveryMethod(event.target.value as DeliveryMethod)
                    }
                    className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {deliveryMethodOptions.length === 0 ? (
                      <option value="">{dictionary.checkout.deliveryMethod}</option>
                    ) : (
                      deliveryMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                {selectedDeliveryMethod && needsDeliveryAddress ? (
                  <DeliveryLocationFields
                    deliveryMethod={selectedDeliveryMethod}
                    dictionary={dictionary}
                    defaultCity={profileDefaults.city}
                    defaultWarehouse={profileDefaults.novaPoshtaBranch}
                  />
                ) : null}
              </div>
              {deliveryMethodOptions.length === 0 ? (
                <DisabledCheckoutNotice text={unavailableDeliveryText} />
              ) : null}
            </FormSection>
            <FormSection title={dictionary.checkout.paymentInfo}>
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                {dictionary.checkout.paymentMethod}
                <select
                  name="paymentMethod"
                  value={selectedPaymentMethod ?? ""}
                  disabled={paymentMethodOptions.length === 0}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as PaymentMethod)
                  }
                  className="h-11 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {paymentMethodOptions.length === 0 ? (
                    <option value="">{dictionary.checkout.paymentMethod}</option>
                  ) : (
                    paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {paymentMethodOptions.length === 0 ? (
                <DisabledCheckoutNotice text={unavailablePaymentText} />
              ) : null}
            </FormSection>
            <FormSection title={couponCopy.title}>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="grid gap-2 text-sm font-semibold text-foreground">
                  {couponCopy.label}
                  <Input
                    value={couponInput}
                    placeholder={couponCopy.placeholder}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      setCouponMessage("");
                    }}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() =>
                      applyCouponCode({
                        code: couponInput,
                        coupons,
                        subtotal,
                        copy: couponCopy,
                        setAppliedCouponCode,
                        setCouponInput,
                        setCouponMessage,
                        setCouponTone,
                      })
                    }
                  >
                    {couponCopy.apply}
                  </Button>
                  {appliedCouponCode ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11"
                      onClick={() => {
                        setAppliedCouponCode("");
                        setCouponMessage(couponCopy.removed);
                        setCouponTone("success");
                      }}
                    >
                      {couponCopy.remove}
                    </Button>
                  ) : null}
                </div>
              </div>
              {couponMessage ? (
                <p
                  className={`mt-3 rounded-lg border px-4 py-3 text-sm font-semibold leading-6 ${
                    couponTone === "success"
                      ? "border-secondary bg-secondary/30 text-secondary-foreground"
                      : "border-primary/30 bg-background text-primary"
                  }`}
                >
                  {couponMessage}
                </p>
              ) : null}
            </FormSection>
            <FormSection title={dictionary.checkout.orderComment}>
              <textarea
                name="comment"
                rows={4}
                placeholder={dictionary.checkout.comment}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </FormSection>
            <Button
              type="submit"
              size="lg"
              disabled={
                deliveryMethodOptions.length === 0 ||
                paymentMethodOptions.length === 0
              }
            >
              {dictionary.checkout.createOrder}
            </Button>
          </form>
        )}
        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">
            {dictionary.cart.summary}
          </h2>
          <div className="mt-5 grid gap-3">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.variantId ?? "base"}-${line.comboOfferId ?? "single"}`}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{line.name}</p>
                  {line.variantLabel ? (
                    <p className="text-xs font-semibold text-muted-foreground">
                      {line.variantLabel}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {line.quantity} × {formatPrice(line.salePrice ?? line.price)}{" "}
                    {dictionary.common.currency}
                  </p>
                </div>
                <p className="font-bold text-foreground">
                  {formatPrice(line.lineTotal)} {dictionary.common.currency}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
            <SummaryRow
              label={dictionary.cart.subtotal}
              value={`${formatPrice(subtotal)} ${dictionary.common.currency}`}
            />
            {discountTotal > 0 ? (
              <SummaryRow
                label={`${couponCopy.discount}${appliedCoupon?.code ? ` (${appliedCoupon.code})` : ""}`}
                value={`-${formatPrice(discountTotal)} ${dictionary.common.currency}`}
              />
            ) : null}
            <SummaryRow
              label={dictionary.cart.delivery}
              value={
                deliveryPrice === 0
                  ? dictionary.cart.freeDelivery
                  : `${formatPrice(deliveryPrice)} ${dictionary.common.currency}`
              }
            />
            <SummaryRow
              label={dictionary.cart.total}
              value={`${formatPrice(total)} ${dictionary.common.currency}`}
              strong
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type CouponCopy = {
  title: string;
  label: string;
  placeholder: string;
  apply: string;
  remove: string;
  removed: string;
  empty: string;
  invalid: string;
  expired: string;
  inactive: string;
  success: (code: string, amount: string) => string;
  discount: string;
};

function getCouponCopy(locale: Locale): CouponCopy {
  if (locale === "uk") {
    return {
      title: "Промокод",
      label: "Код знижки",
      placeholder: "RYTM10",
      apply: "Застосувати",
      remove: "Прибрати",
      removed: "Промокод прибрано.",
      empty: "Введіть промокод.",
      invalid: "Промокод не знайдено.",
      expired: "Термін дії промокоду минув.",
      inactive: "Промокод зараз неактивний.",
      success: (code, amount) => `Промокод ${code} застосовано: -${amount}.`,
      discount: "Знижка",
    };
  }

  return {
    title: "Промокод",
    label: "Код скидки",
    placeholder: "RYTM10",
    apply: "Применить",
    remove: "Убрать",
    removed: "Промокод убран.",
    empty: "Введите промокод.",
    invalid: "Промокод не найден.",
    expired: "Срок действия промокода истек.",
    inactive: "Промокод сейчас неактивен.",
    success: (code, amount) => `Промокод ${code} применен: -${amount}.`,
    discount: "Скидка",
  };
}

function applyCouponCode({
  code,
  coupons,
  subtotal,
  copy,
  setAppliedCouponCode,
  setCouponInput,
  setCouponMessage,
  setCouponTone,
}: {
  code: string;
  coupons: Coupon[];
  subtotal: number;
  copy: CouponCopy;
  setAppliedCouponCode: (value: string) => void;
  setCouponInput: (value: string) => void;
  setCouponMessage: (value: string) => void;
  setCouponTone: (value: "success" | "error") => void;
}) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    setAppliedCouponCode("");
    setCouponMessage(copy.empty);
    setCouponTone("error");
    return;
  }

  const coupon = coupons.find(
    (item) => normalizeCouponCode(item.code) === normalizedCode,
  );

  if (!coupon) {
    setAppliedCouponCode("");
    setCouponMessage(copy.invalid);
    setCouponTone("error");
    return;
  }

  if (!coupon.isActive) {
    setAppliedCouponCode("");
    setCouponMessage(copy.inactive);
    setCouponTone("error");
    return;
  }

  if (isCouponExpired(coupon)) {
    setAppliedCouponCode("");
    setCouponMessage(copy.expired);
    setCouponTone("error");
    return;
  }

  const discount = getCouponDiscount(coupon, subtotal);

  if (discount <= 0) {
    setAppliedCouponCode("");
    setCouponMessage(copy.invalid);
    setCouponTone("error");
    return;
  }

  setAppliedCouponCode(coupon.code);
  setCouponInput(coupon.code);
  setCouponMessage(copy.success(coupon.code, `${formatPrice(discount)} ₴`));
  setCouponTone("success");
}

function getActiveCoupon(code: string, coupons: Coupon[]) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    return undefined;
  }

  const coupon = coupons.find(
    (item) => normalizeCouponCode(item.code) === normalizedCode,
  );

  if (!coupon?.isActive || isCouponExpired(coupon)) {
    return undefined;
  }

  return coupon;
}

function getCouponDiscount(coupon: Coupon, subtotal: number) {
  const safeSubtotal = Math.max(0, subtotal);
  const safeValue = Math.max(0, coupon.discountValue);

  if (safeSubtotal <= 0 || safeValue <= 0) {
    return 0;
  }

  if (coupon.discountType === "percent") {
    const percent = Math.min(90, safeValue);

    return Math.min(safeSubtotal, Math.round(safeSubtotal * (percent / 100)));
  }

  return Math.min(safeSubtotal, Math.round(safeValue));
}

function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function isCouponExpired(coupon: Coupon) {
  if (!coupon.expiresAt) {
    return false;
  }

  const expiresAt = new Date(`${coupon.expiresAt}T23:59:59.999`);

  return Number.isFinite(expiresAt.getTime()) && expiresAt < new Date();
}

function getDeliveryMethodOptions(
  settings: DeliveryPaymentSettings,
  dictionary: Dictionary,
): SelectOption<DeliveryMethod>[] {
  const options: SelectOption<DeliveryMethod>[] = [];

  if (settings.novaPoshtaEnabled) {
    options.push({
      value: "nova_poshta",
      label: dictionary.checkout.novaPoshta,
    });
  }

  if (settings.ukrposhtaEnabled) {
    options.push({
      value: "ukrposhta",
      label: dictionary.checkout.ukrposhta,
    });
  }

  if (settings.pickupEnabled) {
    options.push({
      value: "pickup",
      label: dictionary.checkout.pickup,
    });
  }

  return options;
}

function getPaymentMethodOptions(
  settings: DeliveryPaymentSettings,
  dictionary: Dictionary,
): SelectOption<PaymentMethod>[] {
  const options: SelectOption<PaymentMethod>[] = [];

  if (settings.onlinePaymentEnabled) {
    options.push({
      value: "liqpay",
      label: dictionary.checkout.onlinePayment,
    });
  }

  if (settings.cashOnDeliveryEnabled) {
    options.push({
      value: "cash_on_delivery",
      label: dictionary.checkout.cashOnDelivery,
    });
  }

  if (settings.cardOnDeliveryEnabled) {
    options.push({
      value: "card_on_delivery",
      label: dictionary.checkout.cardOnDelivery,
    });
  }

  return options;
}

function getSelectedOptionValue<T extends string>(
  currentValue: T,
  options: SelectOption<T>[],
) {
  return options.some((option) => option.value === currentValue)
    ? currentValue
    : options[0]?.value;
}

function getInitialProfileDefaults() {
  const session = getCustomerSession();

  return {
    customerName: session?.name ?? "",
    phone: "",
    email: session?.email ?? "",
    city: "",
    novaPoshtaBranch: "",
  };
}

function getPaymentProvider(paymentMethod: PaymentMethod) {
  if (paymentMethod === "liqpay") {
    return "liqpay" as const;
  }

  if (paymentMethod === "card_on_delivery") {
    return "card_on_delivery" as const;
  }

  if (paymentMethod === "cash_on_delivery") {
    return "cash_on_delivery" as const;
  }

  return "manual" as const;
}

function createInitialShipments(
  orderId: string,
  items: MockOrderItem[],
  deliveryMethod: Shipment["deliveryProvider"],
  now: string,
): Shipment[] {
  const supplierIds = Array.from(
    new Set(items.map((item) => item.supplierId || "unassigned")),
  );

  return supplierIds.map((supplierId) => ({
    id: `${orderId}-${supplierId}`,
    orderId,
    supplierId,
    deliveryProvider: deliveryMethod,
    ttnNumber: "",
    deliveryStatus: "pending",
    notificationStatus: "not_sent",
    customerNotificationStatus: "not_sent",
    notificationLog: [],
    createdAt: now,
    updatedAt: now,
  }));
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function DisabledCheckoutNotice({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-semibold leading-6 text-primary">
      {text}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <Input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          strong
            ? "text-lg font-bold text-foreground"
            : "font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}
