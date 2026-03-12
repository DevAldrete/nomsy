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
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex gap-4">
            <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
              Home
            </Link>
            {user && (
              <>
                <Link to="/recipes" className="text-gray-700 hover:text-gray-900 font-medium">
                  Recipes
                </Link>
                <Link to="/calendar" className="text-gray-700 hover:text-gray-900 font-medium">
                  Calendar
                </Link>
              </>
            )}
          </div>
          <div className="flex gap-4">
            {!loading && (user ? (
              <button type="button" onClick={() => logout()} className="text-gray-700 hover:text-gray-900 font-medium">
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                  Log in
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-gray-900 font-medium">
                  Register
                </Link>
              </>
            ))}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
