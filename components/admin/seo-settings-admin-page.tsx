"use client";

import { Save } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  TextAreaField,
  TextField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import { ADMIN_SETTINGS_STORAGE_KEY } from "@/lib/admin/storage";
import type { Locale } from "@/lib/i18n/config";
import type { SiteSettings } from "@/types/store";

type SeoSettingsAdminPageProps = {
  initialSettings: SiteSettings;
};

export function SeoSettingsAdminPage({
  initialSettings,
}: SeoSettingsAdminPageProps) {
  const [settings, setSettings] = useLocalStorageState(
    ADMIN_SETTINGS_STORAGE_KEY,
    initialSettings,
  );
  const { feedback, runAction, isPending } = useAdminActionFeedback();

  function updateSeo(
    key: keyof SiteSettings["seo"],
    locale: Locale,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      seo: {
        ...current.seo,
        [key]: {
          ...current.seo[key],
          [locale]: value,
        },
      },
    }));
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="SEO settings"
        description="Manage localized page titles and descriptions used by search engines and social previews."
        action={
          <Button
            type="button"
            disabled={isPending("save-seo")}
            onClick={() =>
              runAction("save-seo", () => undefined, "SEO settings saved.")
            }
          >
            <Save />
            {isPending("save-seo") ? "Saving..." : "Saved automatically"}
          </Button>
        }
      />
      <AdminCard title="Localized metadata">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="SEO title Ukrainian"
            value={settings.seo.title.uk}
            onChange={(value) => updateSeo("title", "uk", value)}
          />
          <TextField
            label="SEO title Russian"
            value={settings.seo.title.ru}
            onChange={(value) => updateSeo("title", "ru", value)}
          />
          <TextAreaField
            label="SEO description Ukrainian"
            value={settings.seo.description.uk}
            rows={6}
            onChange={(value) => updateSeo("description", "uk", value)}
          />
          <TextAreaField
            label="SEO description Russian"
            value={settings.seo.description.ru}
            rows={6}
            onChange={(value) => updateSeo("description", "ru", value)}
          />
        </div>
      </AdminCard>
      <AdminCard title="Search preview">
        <div className="grid gap-5 md:grid-cols-2">
          <Preview
            label="Ukrainian"
            title={settings.seo.title.uk}
            description={settings.seo.description.uk}
          />
          <Preview
            label="Russian"
            title={settings.seo.title.ru}
            description={settings.seo.description.ru}
          />
        </div>
      </AdminCard>
    </div>
  );
}

function Preview({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <p className="text-xs font-semibold uppercase tracking-normal text-primary">
        {label}
      </p>
      <h2 className="mt-3 text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
