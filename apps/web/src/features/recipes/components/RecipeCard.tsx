import { Link } from "@tanstack/react-router";

type Props = { title: string; id: string; description?: string; prepMin?: number; cookMin?: number };

export function RecipeCard({ title, id, description, prepMin, cookMin }: Props) {
  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: id }}
      className="group block rounded-[var(--radius-card)] border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)]"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-[var(--accent)]" style={{ color: "var(--text)" }}>
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
          {(prepMin != null || cookMin != null) && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
              {[prepMin != null && `Prep ${prepMin} min`, cookMin != null && `Cook ${cookMin} min`].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <span className="shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
