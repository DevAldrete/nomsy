import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12" style={{ background: "var(--bg)" }}>
      <Outlet />
    </div>
  );
}
