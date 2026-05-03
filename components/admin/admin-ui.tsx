import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </section>
  );
}

export function AdminCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-5 shadow-sm", className)}
    >
      {title ? <h2 className="text-lg font-bold text-foreground">{title}</h2> : null}
      {description ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid min-w-0 gap-2 text-sm font-semibold text-foreground", className)}>
      {label}
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
}) {
  return (
    <Field label={label}>
      <Input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full min-w-0 rounded-full border border-input bg-background px-4 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </Field>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--primary)]"
      />
    </label>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
