import { cn } from "@/lib/utils";
import { isPreviewableProductImageUrl } from "@/lib/catalog/product-images";
import type { ProductPreview } from "@/types/store";

const toneStyles: Record<
  ProductPreview["tone"],
  {
    frame: string;
    bottle: string;
    cap: string;
    label: string;
  }
> = {
  rose: {
    frame: "bg-[#f7dfd9]",
    bottle: "bg-[#fff8f3]",
    cap: "bg-[#b46d62]",
    label: "bg-[#efb8ad]",
  },
  sage: {
    frame: "bg-[#deeee3]",
    bottle: "bg-[#fffdf7]",
    cap: "bg-[#7c9b83]",
    label: "bg-[#c8dccf]",
  },
  cream: {
    frame: "bg-[#f4eadc]",
    bottle: "bg-[#fffdfa]",
    cap: "bg-[#c69a6c]",
    label: "bg-[#ead8bf]",
  },
  linen: {
    frame: "bg-[#efe4d7]",
    bottle: "bg-[#fff9ef]",
    cap: "bg-[#9f7b61]",
    label: "bg-[#d8c6ae]",
  },
};

type ProductVisualProps = {
  tone: ProductPreview["tone"];
  imageUrl?: string;
  alt?: string;
  className?: string;
  surface?: "catalog" | "detail" | "thumbnail" | "lightbox";
};

export function ProductVisual({
  tone,
  imageUrl,
  alt = "",
  className,
  surface = "catalog",
}: ProductVisualProps) {
  const styles = toneStyles[tone];
  const canRenderImage = isPreviewableProductImageUrl(imageUrl);

  if (canRenderImage) {
    const normalizedImageUrl = imageUrl?.trim() ?? "";
    const isCatalog = surface === "catalog";
    const isDetail = surface === "detail" || surface === "lightbox";

    return (
      <div
        className={cn(
          "product-shape flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg",
          isCatalog && "bg-white",
          surface === "thumbnail" && "bg-white",
          isDetail && "bg-white",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedImageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-contain",
            isCatalog && "p-2 sm:p-3",
            surface === "thumbnail" && "p-0.5",
            surface === "detail" && "p-2 sm:p-4 lg:p-5",
            surface === "lightbox" && "p-2 sm:p-4",
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "product-shape flex aspect-[4/3] w-full items-end justify-center overflow-hidden rounded-lg p-5",
        styles.frame,
        className,
      )}
      aria-hidden="true"
    >
      <div className="relative h-[78%] w-[36%] min-w-14">
        <div
          className={cn(
            "absolute left-1/2 top-0 h-5 w-10 -translate-x-1/2 rounded-t-md",
            styles.cap,
          )}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-4 rounded-lg border border-white/70",
            styles.bottle,
          )}
        >
          <div
            className={cn(
              "absolute inset-x-3 top-1/2 h-9 -translate-y-1/2 rounded-md",
              styles.label,
            )}
          />
        </div>
      </div>
      <div className="relative ml-4 h-[55%] w-[26%] min-w-10 rounded-lg border border-white/70 bg-white/80">
        <div className={cn("absolute inset-x-2 top-3 h-3 rounded-sm", styles.label)} />
        <div className={cn("absolute inset-x-2 bottom-3 h-8 rounded-md", styles.cap)} />
      </div>
    </div>
  );
}
