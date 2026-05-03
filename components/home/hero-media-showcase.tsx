"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { VisualMedia, isRenderableVisual } from "@/components/home/visual-media";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { HeroMediaSlide } from "@/types/store";

const fallbackImage = "/visuals/realistic/site-hero.jpg";

const fallbackTitle = {
  uk: "Добірка догляду для щоденного ритму",
  ru: "Подборка ухода для ежедневного ритма",
} satisfies Record<Locale, string>;

const viewText = {
  uk: "Дивитися",
  ru: "Смотреть",
} satisfies Record<Locale, string>;

const slideLabel = {
  uk: "Слайд",
  ru: "Слайд",
} satisfies Record<Locale, string>;

type HeroMediaShowcaseProps = {
  locale: Locale;
  storeName: string;
  slides?: HeroMediaSlide[];
  fallbackHeroImage?: string;
};

export function HeroMediaShowcase({
  locale,
  storeName,
  slides,
  fallbackHeroImage,
}: HeroMediaShowcaseProps) {
  const normalizedSlides = useMemo(
    () => getDisplaySlides(slides, fallbackHeroImage),
    [fallbackHeroImage, slides],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const canAnimate = !reduceMotion;
  const safeActiveIndex =
    activeIndex < normalizedSlides.length ? activeIndex : 0;

  useEffect(() => {
    if (!canAnimate || isPaused || normalizedSlides.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % normalizedSlides.length);
    }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [canAnimate, isPaused, normalizedSlides.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/70 bg-card shadow-xl sm:aspect-[16/10] lg:aspect-[5/4] lg:rounded-[1.5rem]">
        {normalizedSlides.map((slide, index) => {
          const isActive = index === safeActiveIndex;
          const title = getSlideTitle(slide, locale);
          const href = getSlideHref(slide, locale);

          return (
            <SlideLink
              key={slide.id}
              href={href}
              className={cn(
                "absolute inset-0 block transition duration-700 ease-out",
                isActive
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0",
              )}
              ariaHidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              <VisualMedia
                imageUrl={slide.imageUrl}
                label={`${title} - ${storeName}`}
                tone="cream"
                className={cn("h-full w-full", canAnimate && isActive && "hero-media-visual")}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(46,39,36,0.04),rgba(46,39,36,0.1)_48%,rgba(46,39,36,0.52))]" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-4 rounded-lg border border-white/40 bg-card/90 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                      {storeName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-base font-bold text-foreground sm:text-lg">
                      {title}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                    {viewText[locale]}
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </SlideLink>
          );
        })}
        {normalizedSlides.length > 1 ? (
          <div className="absolute right-4 top-4 z-20 flex gap-2 rounded-full border border-white/40 bg-card/80 p-2 shadow-sm backdrop-blur">
            {normalizedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${slideLabel[locale]} ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "size-2.5 rounded-full transition",
                  index === safeActiveIndex
                    ? "bg-primary"
                    : "bg-foreground/25 hover:bg-foreground/45",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getDisplaySlides(
  slides: HeroMediaSlide[] | undefined,
  fallbackHeroImage: string | undefined,
): HeroMediaSlide[] {
  const activeSlides = (slides ?? [])
    .filter((slide) => slide.isActive && isRenderableVisual(slide.imageUrl))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeSlides.length > 0) {
    return activeSlides;
  }

  const normalizedFallbackImage = fallbackHeroImage?.trim() ?? "";

  return [
    {
      id: "hero-media-fallback",
      imageUrl: isRenderableVisual(normalizedFallbackImage)
        ? normalizedFallbackImage
        : fallbackImage,
      title: fallbackTitle,
      linkType: "custom",
      href: "/catalog",
      isActive: true,
      sortOrder: 0,
    } satisfies HeroMediaSlide,
  ];
}

function getSlideTitle(slide: HeroMediaSlide, locale: Locale) {
  return slide.title[locale]?.trim() || fallbackTitle[locale];
}

function getSlideHref(slide: HeroMediaSlide, locale: Locale) {
  if (slide.linkType === "product") {
    const slug = slide.productSlug?.trim();

    if (slug) {
      return `/${locale}/products/${encodeURIComponent(slug.replace(/^\/+/, ""))}`;
    }
  }

  const href = slide.href?.trim();

  if (!href) {
    return `/${locale}/catalog`;
  }

  if (isExternalHref(href) || href.startsWith("#")) {
    return href;
  }

  if (
    href === `/${locale}` ||
    href.startsWith(`/${locale}/`) ||
    href === "/uk" ||
    href.startsWith("/uk/") ||
    href === "/ru" ||
    href.startsWith("/ru/")
  ) {
    return href;
  }

  if (href.startsWith("/")) {
    return `/${locale}${href}`;
  }

  return `/${locale}/${href}`;
}

function isExternalHref(href: string) {
  return href.startsWith("https://") || href.startsWith("http://");
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return true;
}

function SlideLink({
  href,
  className,
  ariaHidden,
  tabIndex,
  children,
}: {
  href: string;
  className: string;
  ariaHidden: boolean;
  tabIndex: number;
  children: ReactNode;
}) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        className={className}
        aria-hidden={ariaHidden}
        tabIndex={tabIndex}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-hidden={ariaHidden}
      tabIndex={tabIndex}
    >
      {children}
    </Link>
  );
}
