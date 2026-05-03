"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string;
  maxQuantity: number;
  label: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function AddToCartButton({
  productId,
  variantId,
  maxQuantity,
  label,
  disabled,
  size = "default",
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [wasAdded, setWasAdded] = useState(false);

  function handleAddToCart() {
    addItem(productId, 1, maxQuantity, variantId);
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 1400);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={size === "sm" ? "secondary" : "default"}
      disabled={disabled || maxQuantity <= 0}
      onClick={handleAddToCart}
      className={className}
    >
      {wasAdded ? <Check /> : <ShoppingBag />}
      {label}
    </Button>
  );
}
