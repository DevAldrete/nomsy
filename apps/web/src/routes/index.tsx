import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="animate-in opacity-0 stagger-1 mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
            Plan your week.
            <br />
            <span style={{ color: "var(--accent)" }}>Eat well.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Nomsy helps you plan meals and keep recipes in one place. Build your weekly calendar, add recipes to slots, and never wonder what’s for dinner.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="animate-in opacity-0 stagger-2 inline-flex items-center rounded-full px-6 py-3 text-base font-medium transition-transform hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="animate-in opacity-0 stagger-3 inline-flex items-center rounded-full border px-6 py-3 text-base font-medium transition-colors"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
      <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)]/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            How it works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Save recipes", desc: "Add your go-to dishes and new finds so they’re always one tap away." },
              { step: "2", title: "Plan the week", desc: "Drag recipes onto your weekly calendar for breakfast, lunch, dinner, or snacks." },
              { step: "3", title: "Cook with confidence", desc: "Open the app and see exactly what’s on the menu for today." },
            ].map(({ step, title, desc }, i) => (
              <div
                key={step}
                className="animate-in opacity-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                <span className="font-display text-2xl font-semibold" style={{ color: "var(--accent-muted)" }}>
                  {step}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
