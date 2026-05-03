import { adminNavItems } from "@/components/admin/admin-shell";

type AdminPlaceholderPageProps = {
  section: string;
};

export function AdminPlaceholderPage({ section }: AdminPlaceholderPageProps) {
  const normalizedSection = `/${section}`;
  const navItem = adminNavItems.find((item) => item.href === normalizedSection);
  const title = navItem?.label ?? "Admin section";
  const Icon = navItem?.icon;

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          Protected admin route
        </p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          This protected workspace is ready for store operations and management
          tools.
        </p>
      </section>
      <article className="rounded-lg border border-border bg-card p-8 shadow-sm">
        {Icon ? <Icon className="size-8 text-primary" /> : null}
        <h2 className="mt-5 text-xl font-bold text-foreground">
          {title} workspace
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Navigation, route protection, and session handling are active for this
          admin area.
        </p>
      </article>
    </div>
  );
}
