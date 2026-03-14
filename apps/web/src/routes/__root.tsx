import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { useAuth } from "../features/auth/hooks/useAuth";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, loading } = useCurrentUser();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-tight transition-colors hover:opacity-80"
            style={{ color: "var(--text)" }}
          >
            Nomsy
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: "var(--text-muted)" }}
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/recipes"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Recipes
                </Link>
                <Link
                  to="/calendar/today"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Today
                </Link>
                <Link
                  to="/calendar"
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Calendar
                </Link>
              </>
            )}
            <span className="mx-1 h-4 w-px bg-[var(--border)]" aria-hidden />
            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Log out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-subtle)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-md px-4 py-2 text-sm font-medium transition-colors rounded-full"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    Sign up
                  </Link>
                </>
              ))}
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
