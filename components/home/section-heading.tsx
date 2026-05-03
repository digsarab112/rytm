import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-normal text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Button asChild variant="outline">
          <Link href={actionHref}>
            {actionLabel}
            <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
