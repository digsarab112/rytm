"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Truck } from "lucide-react";

import {
  AdminActionFeedback,
  type AdminActionRunner,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import {
  ADMIN_SUPPLIERS_STORAGE_KEY,
  createAdminId,
} from "@/lib/admin/storage";
import type { Supplier } from "@/types/store";

type SuppliersAdminPageProps = {
  initialSuppliers: Supplier[];
};

export function SuppliersAdminPage({
  initialSuppliers,
}: SuppliersAdminPageProps) {
  const [suppliers, setSuppliers] = useLocalStorageState(
    ADMIN_SUPPLIERS_STORAGE_KEY,
    initialSuppliers,
  );
  const [selectedId, setSelectedId] = useState(suppliers[0]?.id ?? "");
  const { feedback, runAction, isPending } = useAdminActionFeedback();
  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers],
  );
  const selectedSupplier =
    suppliers.find((supplier) => supplier.id === selectedId) ?? suppliers[0];

  function createSupplier() {
    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: createAdminId("supplier"),
      name: "New supplier",
      contactName: "",
      phone: "",
      email: "",
      city: "",
      novaPoshtaWarehouse: "",
      notes: "",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    setSuppliers((currentSuppliers) => [supplier, ...currentSuppliers]);
    setSelectedId(supplier.id);
  }

  function updateSupplier(supplierId: string, updates: Partial<Supplier>) {
    setSuppliers((currentSuppliers) =>
      currentSuppliers.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : supplier,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Suppliers"
        description="Manage vendor contacts, supplier shipping data, and launch-ready dropshipping notes."
        action={
          <Button
            type="button"
            disabled={isPending("create-supplier")}
            onClick={() =>
              runAction(
                "create-supplier",
                createSupplier,
                "Supplier created.",
              )
            }
          >
            <Plus />
            {isPending("create-supplier") ? "Creating..." : "New supplier"}
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Total suppliers" value={String(suppliers.length)} />
        <Metric
          label="Active suppliers"
          value={String(suppliers.filter((supplier) => supplier.isActive).length)}
        />
        <Metric
          label="Inactive suppliers"
          value={String(suppliers.filter((supplier) => !supplier.isActive).length)}
        />
      </section>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <AdminCard title="Supplier directory">
          {sortedSuppliers.length === 0 ? (
            <EmptyState text="No suppliers yet." />
          ) : (
            <div className="grid gap-2">
              {sortedSuppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => setSelectedId(supplier.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    supplier.id === selectedSupplier?.id
                      ? "border-primary bg-secondary"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{supplier.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {supplier.city || "No city"} -{" "}
                        {supplier.contactName || "No contact"}
                      </p>
                    </div>
                    <span className="rounded-full bg-card px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </AdminCard>
        {selectedSupplier ? (
          <SupplierEditor
            supplier={selectedSupplier}
            onChange={(updates) => updateSupplier(selectedSupplier.id, updates)}
            runAction={runAction}
            isPending={isPending}
          />
        ) : (
          <EmptyState text="Select or create a supplier." />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Truck className="size-5" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-foreground">{value}</p>
    </article>
  );
}

function SupplierEditor({
  supplier,
  onChange,
  runAction,
  isPending,
}: {
  supplier: Supplier;
  onChange: (updates: Partial<Supplier>) => void;
  runAction: AdminActionRunner;
  isPending: (actionId: string) => boolean;
}) {
  return (
    <AdminCard
      title="Supplier editor"
      description="Supplier shipping data is internal. It can differ from store-owned Nova Poshta sender data."
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Supplier name"
            value={supplier.name}
            onChange={(name) => onChange({ name })}
          />
          <TextField
            label="Contact name"
            value={supplier.contactName}
            onChange={(contactName) => onChange({ contactName })}
          />
          <TextField
            label="Phone"
            value={supplier.phone}
            onChange={(phone) => onChange({ phone })}
          />
          <TextField
            label="Email"
            value={supplier.email}
            onChange={(email) => onChange({ email })}
          />
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Supplier city"
            value={supplier.city}
            onChange={(city) => onChange({ city })}
          />
          <TextField
            label="Nova Poshta warehouse"
            value={supplier.novaPoshtaWarehouse}
            onChange={(novaPoshtaWarehouse) => onChange({ novaPoshtaWarehouse })}
          />
          <TextField
            label="Telegram"
            value={supplier.supplierTelegram ?? ""}
            onChange={(supplierTelegram) => onChange({ supplierTelegram })}
          />
          <TextField
            label="Viber"
            value={supplier.supplierViber ?? ""}
            onChange={(supplierViber) => onChange({ supplierViber })}
          />
        </section>
        <TextAreaField
          label="Notes"
          value={supplier.notes}
          rows={5}
          onChange={(notes) => onChange({ notes })}
        />
        <TextAreaField
          label="Supplier payment info"
          value={supplier.supplierPaymentInfo ?? ""}
          onChange={(supplierPaymentInfo) => onChange({ supplierPaymentInfo })}
        />
        <ToggleField
          label="Supplier is active"
          checked={supplier.isActive}
          onChange={(isActive) => onChange({ isActive })}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isPending(`save-supplier-${supplier.id}`)}
            onClick={() =>
              runAction(
                `save-supplier-${supplier.id}`,
                () => undefined,
                "Supplier changes saved.",
              )
            }
          >
            <Save />
            {isPending(`save-supplier-${supplier.id}`)
              ? "Saving..."
              : "Saved automatically"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending(`deactivate-supplier-${supplier.id}`)}
            onClick={() =>
              runAction(
                `deactivate-supplier-${supplier.id}`,
                () => onChange({ isActive: false }),
                "Supplier deactivated.",
              )
            }
          >
            {isPending(`deactivate-supplier-${supplier.id}`)
              ? "Saving..."
              : "Deactivate supplier"}
          </Button>
        </div>
      </div>
    </AdminCard>
  );
}
