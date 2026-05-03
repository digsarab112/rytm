"use client";

import { AlertTriangle, Save } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { ADMIN_DELIVERY_PAYMENT_STORAGE_KEY } from "@/lib/admin/storage";
import type { DeliveryPaymentSettings } from "@/types/admin";

type DeliveryPaymentAdminPageProps = {
  initialSettings: DeliveryPaymentSettings;
};

export function DeliveryPaymentAdminPage({
  initialSettings,
}: DeliveryPaymentAdminPageProps) {
  const [settings, setSettings] = useLocalStorageState(
    ADMIN_DELIVERY_PAYMENT_STORAGE_KEY,
    initialSettings,
  );
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Delivery and payment"
        description="Manage customer-facing delivery text, payment text, and available fulfillment methods."
        action={
          <Button
            type="button"
            disabled={isPending("save-delivery-payment")}
            onClick={() =>
              runAction(
                "save-delivery-payment",
                () => undefined,
                "Delivery and payment settings saved.",
              )
            }
          >
            <Save />
            {isPending("save-delivery-payment")
              ? "Saving..."
              : "Saved automatically"}
          </Button>
        }
      />
      <AdminCard
        title="Delivery methods"
        description="Customer-facing checkout delivery methods. Self-pickup is disabled for the dropshipping launch flow."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleField
            label="Nova Poshta"
            checked={settings.novaPoshtaEnabled}
            onChange={(novaPoshtaEnabled) =>
              setSettings((current) => ({ ...current, novaPoshtaEnabled }))
            }
          />
          <ToggleField
            label="Ukrposhta"
            checked={settings.ukrposhtaEnabled}
            onChange={(ukrposhtaEnabled) =>
              setSettings((current) => ({ ...current, ukrposhtaEnabled }))
            }
          />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-bold text-foreground">
              Pickup is disabled for customers
            </p>
            <p className="mt-1 leading-6">
              Legacy pickup values may still be displayed for old orders, but
              checkout should only offer shipment-based delivery methods.
            </p>
          </div>
        </div>
      </AdminCard>
      <AdminCard
        title="Delivery pricing"
        description="Update these values when carrier prices change. The cart and checkout summary use the same values."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Delivery price, UAH"
            type="number"
            min="0"
            value={settings.deliveryPrice}
            onChange={(deliveryPrice) =>
              setSettings((current) => ({
                ...current,
                deliveryPrice: Number(deliveryPrice) || 0,
              }))
            }
          />
          <TextField
            label="Free delivery from, UAH"
            type="number"
            min="0"
            value={settings.freeDeliveryThreshold}
            onChange={(freeDeliveryThreshold) =>
              setSettings((current) => ({
                ...current,
                freeDeliveryThreshold: Number(freeDeliveryThreshold) || 0,
              }))
            }
          />
        </div>
      </AdminCard>
      <AdminCard title="Payment methods">
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleField
            label="Cash on delivery"
            checked={settings.cashOnDeliveryEnabled}
            onChange={(cashOnDeliveryEnabled) =>
              setSettings((current) => ({
                ...current,
                cashOnDeliveryEnabled,
              }))
            }
          />
          <ToggleField
            label="Online payment"
            checked={settings.onlinePaymentEnabled}
            onChange={(onlinePaymentEnabled) =>
              setSettings((current) => ({ ...current, onlinePaymentEnabled }))
            }
          />
        </div>
      </AdminCard>
      <AdminCard title="Customer text">
        <div className="grid gap-4 md:grid-cols-2">
          <TextAreaField
            label="Delivery text Ukrainian"
            value={settings.deliveryTextUk}
            rows={7}
            onChange={(deliveryTextUk) =>
              setSettings((current) => ({ ...current, deliveryTextUk }))
            }
          />
          <TextAreaField
            label="Delivery text Russian"
            value={settings.deliveryTextRu}
            rows={7}
            onChange={(deliveryTextRu) =>
              setSettings((current) => ({ ...current, deliveryTextRu }))
            }
          />
          <TextAreaField
            label="Payment text Ukrainian"
            value={settings.paymentTextUk}
            rows={7}
            onChange={(paymentTextUk) =>
              setSettings((current) => ({ ...current, paymentTextUk }))
            }
          />
          <TextAreaField
            label="Payment text Russian"
            value={settings.paymentTextRu}
            rows={7}
            onChange={(paymentTextRu) =>
              setSettings((current) => ({ ...current, paymentTextRu }))
            }
          />
        </div>
      </AdminCard>
    </div>
  );
}
