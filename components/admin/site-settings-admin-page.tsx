"use client";

import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import { AdminImageUploadField } from "@/components/admin/image-upload-field";
import {
  AdminCard,
  AdminPageHeader,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import { createAdminId, ADMIN_SETTINGS_STORAGE_KEY } from "@/lib/admin/storage";
import { getProductName } from "@/lib/catalog/helpers";
import type { Locale } from "@/lib/i18n/config";
import type {
  HeroMediaSlide,
  LocalizedText,
  ProductPreview,
  SiteSettings,
  VisualTone,
} from "@/types/store";

type SiteSettingsAdminPageProps = {
  initialSettings: SiteSettings;
  products?: ProductPreview[];
};

export function SiteSettingsAdminPage({
  initialSettings,
  products = [],
}: SiteSettingsAdminPageProps) {
  const [settings, setSettings] = useLocalStorageState(
    ADMIN_SETTINGS_STORAGE_KEY,
    initialSettings,
  );
  const { feedback, runAction, isPending } = useAdminActionFeedback();
  const heroSlides = getSortedHeroSlides(settings.heroMediaSlides);

  function updateLocalized(
    key: "slogan" | "description" | "footerText",
    locale: Locale,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: {
        ...(current[key] as LocalizedText),
        [locale]: value,
      },
    }));
  }

  function updateHero(
    key: keyof SiteSettings["hero"],
    locale: Locale,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [key]: {
          ...current.hero[key],
          [locale]: value,
        },
      },
    }));
  }

  function updatePromo(
    key: keyof SiteSettings["promoBanner"],
    locale: Locale,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      promoBanner: {
        ...current.promoBanner,
        [key]: {
          ...current.promoBanner[key],
          [locale]: value,
        },
      },
    }));
  }

  function updateVisual(
    key: keyof NonNullable<SiteSettings["visuals"]>,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      visuals: {
        ...(current.visuals ?? {}),
        [key]: value,
      },
    }));
  }

  function addHeroSlide() {
    setSettings((current) => {
      const slides = getSortedHeroSlides(current.heroMediaSlides);

      return {
        ...current,
        heroMediaSlides: normalizeHeroSlideOrder([
          ...slides,
          createHeroSlide(current.visuals?.heroImage, products[0]?.slug),
        ]),
      };
    });
  }

  function updateHeroSlide(id: string, updates: Partial<HeroMediaSlide>) {
    setSettings((current) => ({
      ...current,
      heroMediaSlides: getSortedHeroSlides(current.heroMediaSlides).map((slide) =>
        slide.id === id ? { ...slide, ...updates } : slide,
      ),
    }));
  }

  function removeHeroSlide(id: string) {
    setSettings((current) => ({
      ...current,
      heroMediaSlides: normalizeHeroSlideOrder(
        getSortedHeroSlides(current.heroMediaSlides).filter((slide) => slide.id !== id),
      ),
    }));
  }

  function moveHeroSlide(id: string, direction: -1 | 1) {
    setSettings((current) => {
      const slides = getSortedHeroSlides(current.heroMediaSlides);
      const currentIndex = slides.findIndex((slide) => slide.id === id);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= slides.length) {
        return current;
      }

      const nextSlides = [...slides];
      const currentSlide = nextSlides[currentIndex];
      nextSlides[currentIndex] = nextSlides[nextIndex];
      nextSlides[nextIndex] = currentSlide;

      return {
        ...current,
        heroMediaSlides: normalizeHeroSlideOrder(nextSlides),
      };
    });
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Site settings"
        description="Manage store identity, localized brand text, colors, contact details, hero content, and promotional messaging."
        action={
          <Button
            type="button"
            disabled={isPending("save-site-settings")}
            onClick={() =>
              runAction(
                "save-site-settings",
                () => undefined,
                "Site settings saved.",
              )
            }
          >
            <Save />
            {isPending("save-site-settings") ? "Saving..." : "Saved automatically"}
          </Button>
        }
      />
      <div className="grid gap-6">
        <AdminCard title="Store identity">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Store name"
              value={settings.storeName}
              onChange={(storeName) =>
                setSettings((current) => ({ ...current, storeName }))
              }
            />
            <TextField
              label="Logo text"
              value={settings.branding?.logoText ?? settings.storeName}
              onChange={(logoText) =>
                setSettings((current) => ({
                  ...current,
                  branding: {
                    ...(current.branding ?? {}),
                    logoText,
                    faviconText: current.branding?.faviconText ?? "R",
                  },
                }))
              }
            />
            <TextField
              label="Favicon text"
              value={settings.branding?.faviconText ?? "R"}
              onChange={(faviconText) =>
                setSettings((current) => ({
                  ...current,
                  branding: {
                    ...(current.branding ?? {}),
                    logoText: current.branding?.logoText ?? current.storeName,
                    faviconText,
                  },
                }))
              }
            />
            <AdminImageUploadField
              label="Logo image"
              value={settings.branding?.logoAsset ?? ""}
              purpose="logo"
              tone="cream"
              previewClassName="aspect-[5/2]"
              onChange={(logoAsset) =>
                setSettings((current) => ({
                  ...current,
                  branding: {
                    ...(current.branding ?? {}),
                    logoText: current.branding?.logoText ?? current.storeName,
                    faviconText: current.branding?.faviconText ?? "R",
                    logoAsset,
                  },
                }))
              }
            />
            <AdminImageUploadField
              label="Favicon asset reference"
              value={settings.branding?.faviconAsset ?? ""}
              purpose="logo"
              tone="cream"
              previewClassName="aspect-square max-w-40"
              onChange={(faviconAsset) =>
                setSettings((current) => ({
                  ...current,
                  branding: {
                    ...(current.branding ?? {}),
                    logoText: current.branding?.logoText ?? current.storeName,
                    faviconText: current.branding?.faviconText ?? "R",
                    faviconAsset,
                  },
                }))
              }
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextAreaField
              label="Slogan Ukrainian"
              value={settings.slogan.uk}
              onChange={(value) => updateLocalized("slogan", "uk", value)}
            />
            <TextAreaField
              label="Slogan Russian"
              value={settings.slogan.ru}
              onChange={(value) => updateLocalized("slogan", "ru", value)}
            />
            <TextAreaField
              label="Description Ukrainian"
              value={settings.description.uk}
              onChange={(value) => updateLocalized("description", "uk", value)}
            />
            <TextAreaField
              label="Description Russian"
              value={settings.description.ru}
              onChange={(value) => updateLocalized("description", "ru", value)}
            />
            <TextAreaField
              label="Footer text Ukrainian"
              value={settings.footerText.uk}
              onChange={(value) => updateLocalized("footerText", "uk", value)}
            />
            <TextAreaField
              label="Footer text Russian"
              value={settings.footerText.ru}
              onChange={(value) => updateLocalized("footerText", "ru", value)}
            />
          </div>
        </AdminCard>
        <AdminCard title="Colors and contact">
          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              label="Primary color"
              type="color"
              value={settings.colors.primary}
              onChange={(primary) =>
                setSettings((current) => ({
                  ...current,
                  colors: { ...current.colors, primary },
                }))
              }
            />
            <TextField
              label="Secondary color"
              type="color"
              value={settings.colors.secondary}
              onChange={(secondary) =>
                setSettings((current) => ({
                  ...current,
                  colors: { ...current.colors, secondary },
                }))
              }
            />
            <TextField
              label="Accent color"
              type="color"
              value={settings.colors.accent}
              onChange={(accent) =>
                setSettings((current) => ({
                  ...current,
                  colors: { ...current.colors, accent },
                }))
              }
            />
            <TextField
              label="Contact phone"
              value={settings.contactPhone}
              onChange={(contactPhone) =>
                setSettings((current) => ({ ...current, contactPhone }))
              }
            />
            <TextField
              label="Contact email"
              value={settings.contactEmail}
              onChange={(contactEmail) =>
                setSettings((current) => ({ ...current, contactEmail }))
              }
            />
            <TextField
              label="Instagram"
              value={settings.socialLinks?.instagram ?? ""}
              onChange={(instagram) =>
                setSettings((current) => ({
                  ...current,
                  socialLinks: { ...(current.socialLinks ?? {}), instagram },
                }))
              }
            />
            <TextField
              label="Facebook"
              value={settings.socialLinks?.facebook ?? ""}
              onChange={(facebook) =>
                setSettings((current) => ({
                  ...current,
                  socialLinks: { ...(current.socialLinks ?? {}), facebook },
                }))
              }
            />
            <TextField
              label="Telegram"
              value={settings.socialLinks?.telegram ?? ""}
              onChange={(telegram) =>
                setSettings((current) => ({
                  ...current,
                  socialLinks: { ...(current.socialLinks ?? {}), telegram },
                }))
              }
            />
          </div>
        </AdminCard>
        <AdminCard
          title="Visual content"
          description="Configure image URLs for the public homepage. Use approved /public paths or trusted remote image URLs."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <VisualUrlField
              label="Homepage hero visual URL"
              value={settings.visuals?.heroImage ?? ""}
              tone="cream"
              onChange={(value) => updateVisual("heroImage", value)}
            />
            <VisualUrlField
              label="Promo banner visual URL"
              value={settings.visuals?.promoImage ?? ""}
              tone="sage"
              onChange={(value) => updateVisual("promoImage", value)}
            />
            <VisualUrlField
              label="Wellness section visual URL"
              value={settings.visuals?.wellnessImage ?? ""}
              tone="linen"
              onChange={(value) => updateVisual("wellnessImage", value)}
            />
            <VisualUrlField
              label="Section banner visual URL"
              value={settings.visuals?.sectionImage ?? ""}
              tone="rose"
              onChange={(value) => updateVisual("sectionImage", value)}
            />
            <VisualUrlField
              label="Newsletter visual URL"
              value={settings.visuals?.newsletterImage ?? ""}
              tone="cream"
              onChange={(value) => updateVisual("newsletterImage", value)}
            />
          </div>
        </AdminCard>
        <AdminCard
          title="Hero media slides"
          description="Configure animated, clickable hero media for the public homepage. Active slides can open a product page or an internal store page."
        >
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={addHeroSlide}>
              <Plus />
              Add slide
            </Button>
          </div>
          {heroSlides.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                    <VisualMedia
                      imageUrl={slide.imageUrl}
                      label={`Hero media slide ${index + 1}`}
                      tone="cream"
                      className="aspect-[16/10] rounded-lg border border-border shadow-sm"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Image or GIF URL"
                        value={slide.imageUrl}
                        onChange={(imageUrl) =>
                          updateHeroSlide(slide.id, { imageUrl })
                        }
                      />
                      <SelectField
                        label="Link target"
                        value={slide.linkType}
                        onChange={(value) =>
                          updateHeroSlide(slide.id, {
                            linkType: value as HeroMediaSlide["linkType"],
                            productSlug:
                              value === "product"
                                ? slide.productSlug ?? products[0]?.slug
                                : slide.productSlug,
                          })
                        }
                      >
                        <option value="custom">Store page</option>
                        <option value="product">Product page</option>
                      </SelectField>
                      <TextField
                        label="Title Ukrainian"
                        value={slide.title.uk}
                        onChange={(value) =>
                          updateHeroSlide(slide.id, {
                            title: { ...slide.title, uk: value },
                          })
                        }
                      />
                      <TextField
                        label="Title Russian"
                        value={slide.title.ru}
                        onChange={(value) =>
                          updateHeroSlide(slide.id, {
                            title: { ...slide.title, ru: value },
                          })
                        }
                      />
                      {slide.linkType === "product" ? (
                        products.length > 0 ? (
                          <SelectField
                            label="Product"
                            value={slide.productSlug ?? products[0]?.slug ?? ""}
                            onChange={(productSlug) =>
                              updateHeroSlide(slide.id, { productSlug })
                            }
                          >
                            {products.map((product) => (
                              <option key={product.id} value={product.slug}>
                                {getProductName(product, "uk")}
                              </option>
                            ))}
                          </SelectField>
                        ) : (
                          <TextField
                            label="Product slug"
                            value={slide.productSlug ?? ""}
                            onChange={(productSlug) =>
                              updateHeroSlide(slide.id, { productSlug })
                            }
                          />
                        )
                      ) : (
                        <TextField
                          label="Store page link"
                          value={slide.href ?? ""}
                          onChange={(href) => updateHeroSlide(slide.id, { href })}
                        />
                      )}
                      <ToggleField
                        label="Active"
                        checked={slide.isActive}
                        onChange={(isActive) =>
                          updateHeroSlide(slide.id, { isActive })
                        }
                      />
                      <div className="md:col-span-2">
                        <AdminImageUploadField
                          label="Upload slide image or GIF"
                          value={slide.imageUrl}
                          purpose="hero"
                          tone="cream"
                          previewClassName="aspect-[16/7]"
                          onChange={(imageUrl) =>
                            updateHeroSlide(slide.id, { imageUrl })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveHeroSlide(slide.id, -1)}
                    >
                      <ArrowUp />
                      Move up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === heroSlides.length - 1}
                      onClick={() => moveHeroSlide(slide.id, 1)}
                    >
                      <ArrowDown />
                      Move down
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeroSlide(slide.id)}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No hero media slides yet.
            </div>
          )}
        </AdminCard>
        <AdminCard title="Homepage hero">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Eyebrow Ukrainian"
              value={settings.hero.eyebrow.uk}
              onChange={(value) => updateHero("eyebrow", "uk", value)}
            />
            <TextField
              label="Eyebrow Russian"
              value={settings.hero.eyebrow.ru}
              onChange={(value) => updateHero("eyebrow", "ru", value)}
            />
            <TextAreaField
              label="Title Ukrainian"
              value={settings.hero.title.uk}
              onChange={(value) => updateHero("title", "uk", value)}
            />
            <TextAreaField
              label="Title Russian"
              value={settings.hero.title.ru}
              onChange={(value) => updateHero("title", "ru", value)}
            />
            <TextAreaField
              label="Subtitle Ukrainian"
              value={settings.hero.subtitle.uk}
              onChange={(value) => updateHero("subtitle", "uk", value)}
            />
            <TextAreaField
              label="Subtitle Russian"
              value={settings.hero.subtitle.ru}
              onChange={(value) => updateHero("subtitle", "ru", value)}
            />
            <TextField
              label="CTA Ukrainian"
              value={settings.hero.ctaText.uk}
              onChange={(value) => updateHero("ctaText", "uk", value)}
            />
            <TextField
              label="CTA Russian"
              value={settings.hero.ctaText.ru}
              onChange={(value) => updateHero("ctaText", "ru", value)}
            />
            <TextField
              label="Secondary CTA Ukrainian"
              value={settings.hero.secondaryCtaText.uk}
              onChange={(value) => updateHero("secondaryCtaText", "uk", value)}
            />
            <TextField
              label="Secondary CTA Russian"
              value={settings.hero.secondaryCtaText.ru}
              onChange={(value) => updateHero("secondaryCtaText", "ru", value)}
            />
          </div>
        </AdminCard>
        <AdminCard title="Promo banner">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Title Ukrainian"
              value={settings.promoBanner.title.uk}
              onChange={(value) => updatePromo("title", "uk", value)}
            />
            <TextField
              label="Title Russian"
              value={settings.promoBanner.title.ru}
              onChange={(value) => updatePromo("title", "ru", value)}
            />
            <TextAreaField
              label="Text Ukrainian"
              value={settings.promoBanner.text.uk}
              onChange={(value) => updatePromo("text", "uk", value)}
            />
            <TextAreaField
              label="Text Russian"
              value={settings.promoBanner.text.ru}
              onChange={(value) => updatePromo("text", "ru", value)}
            />
            <TextField
              label="CTA Ukrainian"
              value={settings.promoBanner.ctaText.uk}
              onChange={(value) => updatePromo("ctaText", "uk", value)}
            />
            <TextField
              label="CTA Russian"
              value={settings.promoBanner.ctaText.ru}
              onChange={(value) => updatePromo("ctaText", "ru", value)}
            />
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function createHeroSlide(
  currentHeroImage: string | undefined,
  productSlug: string | undefined,
): HeroMediaSlide {
  return {
    id: createAdminId("hero-media"),
    imageUrl: currentHeroImage?.trim() || "/visuals/realistic/site-hero.jpg",
    title: {
      uk: "Новий банер",
      ru: "Новый баннер",
    },
    linkType: "custom",
    href: "/catalog",
    productSlug,
    isActive: true,
    sortOrder: 0,
  };
}

function getSortedHeroSlides(slides: HeroMediaSlide[] | undefined) {
  return [...(slides ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeHeroSlideOrder(slides: HeroMediaSlide[]) {
  return slides.map((slide, index) => ({
    ...slide,
    sortOrder: (index + 1) * 10,
  }));
}

function VisualUrlField({
  label,
  value,
  tone,
  onChange,
}: {
  label: string;
  value: string;
  tone: VisualTone;
  onChange: (value: string) => void;
}) {
  return (
    <AdminImageUploadField
      label={label}
      value={value}
      onChange={onChange}
      purpose="site"
      tone={tone}
      previewClassName="aspect-[16/7]"
    />
  );
}
