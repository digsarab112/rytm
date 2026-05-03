"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CART_STORAGE_KEY } from "@/lib/cart/storage";
import type { CartItem } from "@/types/cart";

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  addItem: (
    productId: string,
    quantity?: number,
    maxQuantity?: number,
    variantId?: string,
    options?: CartItemOptions,
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    maxQuantity?: number,
    variantId?: string,
    comboOfferId?: string,
  ) => void;
  removeItem: (productId: string, variantId?: string, comboOfferId?: string) => void;
  clearCart: () => void;
  isReady: boolean;
};

type CartItemOptions = Pick<
  CartItem,
  | "comboOfferId"
  | "comboSourceProductId"
  | "comboProductIds"
  | "comboDiscountPercent"
>;

const CartContext = createContext<CartContextValue | null>(null);

function normalizeQuantity(quantity: number, maxQuantity = Number.POSITIVE_INFINITY) {
  return Math.max(0, Math.min(Math.floor(quantity), maxQuantity));
}

function normalizeVariantId(variantId: string | undefined) {
  const normalized = variantId?.trim();

  return normalized ? normalized : undefined;
}

function normalizeCartToken(value: string | undefined) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function normalizeCartProductIds(value: string[] | undefined) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = Array.from(
    new Set(value.map((item) => normalizeCartToken(item)).filter(Boolean)),
  ) as string[];

  return ids.length > 0 ? ids : undefined;
}

function isSameCartItem(
  item: Pick<CartItem, "productId" | "variantId">,
  productId: string,
  variantId?: string,
) {
  return (
    item.productId === productId &&
    normalizeVariantId(item.variantId) === normalizeVariantId(variantId)
  );
}

function isSameCartLine(
  item: Pick<CartItem, "productId" | "variantId" | "comboOfferId">,
  productId: string,
  variantId?: string,
  comboOfferId?: string,
) {
  return (
    isSameCartItem(item, productId, variantId) &&
    normalizeCartToken(item.comboOfferId) === normalizeCartToken(comboOfferId)
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsed = JSON.parse(storedCart) as CartItem[];
          setItems(
            parsed
              .filter(
                (item) =>
                  typeof item.productId === "string" &&
                  Number.isFinite(item.quantity),
              )
              .map((item) => ({
                productId: item.productId,
                variantId: normalizeVariantId(item.variantId),
                comboOfferId: normalizeCartToken(item.comboOfferId),
                comboSourceProductId: normalizeCartToken(item.comboSourceProductId),
                comboProductIds: normalizeCartProductIds(item.comboProductIds),
                comboDiscountPercent:
                  typeof item.comboDiscountPercent === "number"
                    ? item.comboDiscountPercent
                    : undefined,
                quantity: normalizeQuantity(item.quantity),
              }))
              .filter((item) => item.quantity > 0),
          );
        }
      } catch {
        setItems([]);
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const addItem = useCallback(
    (
      productId: string,
      quantity = 1,
      maxQuantity?: number,
      variantId?: string,
      options: CartItemOptions = {},
    ) => {
      const normalizedVariantId = normalizeVariantId(variantId);
      const normalizedComboOfferId = normalizeCartToken(options.comboOfferId);
      const normalizedComboSourceProductId = normalizeCartToken(
        options.comboSourceProductId,
      );
      const normalizedComboProductIds = normalizeCartProductIds(
        options.comboProductIds,
      );

      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) =>
            isSameCartLine(
              item,
              productId,
              normalizedVariantId,
              normalizedComboOfferId,
            ),
        );

        if (!existingItem) {
          const nextQuantity = normalizeQuantity(quantity, maxQuantity);
          return nextQuantity > 0
            ? [
                ...currentItems,
                {
                  productId,
                  variantId: normalizedVariantId,
                  comboOfferId: normalizedComboOfferId,
                  comboSourceProductId: normalizedComboSourceProductId,
                  comboProductIds: normalizedComboProductIds,
                  comboDiscountPercent: options.comboDiscountPercent,
                  quantity: nextQuantity,
                },
              ]
            : currentItems;
        }

        return currentItems.map((item) =>
          isSameCartLine(
            item,
            productId,
            normalizedVariantId,
            normalizedComboOfferId,
          )
            ? {
                ...item,
                comboProductIds:
                  normalizedComboProductIds ?? item.comboProductIds,
                quantity: normalizeQuantity(
                  item.quantity + quantity,
                  maxQuantity,
                ),
              }
            : item,
        );
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      maxQuantity?: number,
      variantId?: string,
      comboOfferId?: string,
    ) => {
      const normalizedVariantId = normalizeVariantId(variantId);
      const normalizedComboOfferId = normalizeCartToken(comboOfferId);
      const nextQuantity = normalizeQuantity(quantity, maxQuantity);

      setItems((currentItems) =>
        nextQuantity === 0
          ? currentItems.filter(
              (item) =>
                !isSameCartLine(
                  item,
                  productId,
                  normalizedVariantId,
                  normalizedComboOfferId,
                ),
            )
          : currentItems.map((item) =>
              isSameCartLine(
                item,
                productId,
                normalizedVariantId,
                normalizedComboOfferId,
              )
                ? { ...item, quantity: nextQuantity }
                : item,
            ),
      );
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string, comboOfferId?: string) => {
      const normalizedVariantId = normalizeVariantId(variantId);
      const normalizedComboOfferId = normalizeCartToken(comboOfferId);

      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            !isSameCartLine(
              item,
              productId,
              normalizedVariantId,
              normalizedComboOfferId,
            ),
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isReady,
    }),
    [addItem, clearCart, isReady, items, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
