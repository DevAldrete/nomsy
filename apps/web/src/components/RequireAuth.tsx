import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return <>{children}</>;
}
