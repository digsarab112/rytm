"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  type AdminActionRunner,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  SelectField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { ADMIN_COUPONS_STORAGE_KEY, createAdminId } from "@/lib/admin/storage";
import type { Coupon, DiscountType } from "@/types/admin";

const discountTypes: DiscountType[] = ["percent", "fixed"];

export function CouponsAdminPage({ initialCoupons = [] }: { initialCoupons?: Coupon[] }) {
  const [coupons, setCoupons] = useLocalStorageState<Coupon[]>(
    ADMIN_COUPONS_STORAGE_KEY,
    initialCoupons,
  );
  const [selectedId, setSelectedId] = useState("");
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  const sortedCoupons = useMemo(
    () => [...coupons].sort((a, b) => a.code.localeCompare(b.code)),
    [coupons],
  );
  const selectedCoupon =
    coupons.find((coupon) => coupon.id === selectedId) ?? coupons[0];

  function createCoupon() {
    const now = new Date().toISOString();
    const coupon: Coupon = {
      id: createAdminId("coupon"),
      code: `RYTM${String(coupons.length + 1).padStart(2, "0")}`,
      discountType: "percent",
      discountValue: 10,
      isActive: true,
      expiresAt: "",
      usageLimit: undefined,
      createdAt: now,
      updatedAt: now,
    };

    setCoupons((currentCoupons) => [coupon, ...currentCoupons]);
    setSelectedId(coupon.id);
  }

  function updateCoupon(couponId: string, updates: Partial<Coupon>) {
    setCoupons((currentCoupons) =>
      currentCoupons.map((coupon) =>
        coupon.id === couponId
          ? { ...coupon, ...updates, updatedAt: new Date().toISOString() }
          : coupon,
      ),
    );
  }

  function deleteCoupon(couponId: string) {
    setCoupons((currentCoupons) =>
      currentCoupons.filter((coupon) => coupon.id !== couponId),
    );
    setSelectedId(coupons.find((coupon) => coupon.id !== couponId)?.id ?? "");
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount codes, active state, expiration, and usage limits."
        action={
          <Button
            type="button"
            disabled={isPending("create-coupon")}
            onClick={() =>
              runAction("create-coupon", createCoupon, "Coupon created.")
            }
          >
            <Plus />
            {isPending("create-coupon") ? "Creating..." : "New coupon"}
          </Button>
        }
      />
      {coupons.length === 0 ? (
        <EmptyState text="No coupons yet. Create a coupon to offer a customer discount." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <AdminCard title="Coupon codes">
            <div className="grid gap-2">
              {sortedCoupons.map((coupon) => (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => setSelectedId(coupon.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    coupon.id === selectedCoupon?.id
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-foreground">{coupon.code}</p>
                    <span className="rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {coupon.discountType === "percent"
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue} UAH`}
                  </p>
                </button>
              ))}
            </div>
          </AdminCard>
          {selectedCoupon ? (
            <CouponEditor
              coupon={selectedCoupon}
              onChange={(updates) => updateCoupon(selectedCoupon.id, updates)}
              onDelete={() => deleteCoupon(selectedCoupon.id)}
              runAction={runAction}
              isPending={isPending}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function CouponEditor({
  coupon,
  onChange,
  onDelete,
  runAction,
  isPending,
}: {
  coupon: Coupon;
  onChange: (updates: Partial<Coupon>) => void;
  onDelete: () => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  return (
    <AdminCard
      title="Coupon editor"
      description="Configure code, discount type, value, expiration, and visibility."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Code"
            value={coupon.code}
            onChange={(code) => onChange({ code: code.toUpperCase() })}
          />
          <SelectField
            label="Discount type"
            value={coupon.discountType}
            onChange={(discountType) =>
              onChange({ discountType: discountType as DiscountType })
            }
          >
            {discountTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Discount value"
            type="number"
            min="0"
            value={coupon.discountValue}
            onChange={(discountValue) =>
              onChange({ discountValue: Number(discountValue) || 0 })
            }
          />
          <TextField
            label="Expiration date"
            type="date"
            value={coupon.expiresAt}
            onChange={(expiresAt) => onChange({ expiresAt })}
          />
          <TextField
            label="Usage limit"
            type="number"
            min="0"
            value={coupon.usageLimit ?? ""}
            onChange={(usageLimit) =>
              onChange({
                usageLimit: usageLimit ? Number(usageLimit) : undefined,
              })
            }
          />
          <ToggleField
            label="Active"
            checked={coupon.isActive}
            onChange={(isActive) => onChange({ isActive })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending(`save-coupon-${coupon.id}`)}
            onClick={() =>
              runAction(
                `save-coupon-${coupon.id}`,
                () => undefined,
                "Coupon changes saved.",
              )
            }
          >
            <Save />
            {isPending(`save-coupon-${coupon.id}`)
              ? "Saving..."
              : "Saved automatically"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`delete-coupon-${coupon.id}`)}
            onClick={() =>
              runAction(
                `delete-coupon-${coupon.id}`,
                onDelete,
                "Coupon deleted.",
              )
            }
          >
            <Trash2 />
            {isPending(`delete-coupon-${coupon.id}`)
              ? "Deleting..."
              : "Delete coupon"}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
