import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const roundedRating = Math.round(rating);
  const iconClassName = size === "md" ? "size-5" : "size-4";

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const isFilled = index + 1 <= roundedRating;

        return (
          <Star
            key={index}
            className={cn(
              iconClassName,
              isFilled
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        );
      })}
    </span>
  );
}
