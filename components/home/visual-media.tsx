import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { VisualTone } from "@/types/store";

const toneClasses: Record<VisualTone, string> = {
  rose: "bg-[#f8dfda]",
  sage: "bg-[#dfefe5]",
  cream: "bg-[#f5eadb]",
  linen: "bg-[#eee2d4]",
};

type VisualMediaProps = {
  imageUrl?: string;
  label?: string;
  tone?: VisualTone;
  className?: string;
  children?: ReactNode;
};

export function isRenderableVisual(imageUrl?: string) {
  const normalizedUrl = imageUrl?.trim();

  return Boolean(
    normalizedUrl &&
      (normalizedUrl.startsWith("/") ||
        normalizedUrl.startsWith("http://") ||
        normalizedUrl.startsWith("https://")),
  );
}

export function getVisualMediaStyle(imageUrl?: string): CSSProperties | undefined {
  const normalizedUrl = imageUrl?.trim();

  if (!isRenderableVisual(normalizedUrl)) {
    return undefined;
  }

  return {
    backgroundImage: `url(${JSON.stringify(normalizedUrl)})`,
  };
}

export function VisualMedia({
  imageUrl,
  label,
  tone = "cream",
  className,
  children,
}: VisualMediaProps) {
  const hasImage = isRenderableVisual(imageUrl);

  return (
    <div
      role={label && hasImage ? "img" : undefined}
      aria-label={label && hasImage ? label : undefined}
      aria-hidden={!label ? "true" : undefined}
      className={cn(
        "relative overflow-hidden bg-cover bg-center",
        toneClasses[tone],
        className,
      )}
      style={getVisualMediaStyle(imageUrl)}
    >
      {!hasImage ? (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0)_48%,rgba(159,95,85,0.16))]" />
      ) : null}
      {children ? <div className="relative z-10">{children}</div> : null}
    </div>
  );
}
