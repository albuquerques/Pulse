import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <main className="mx-auto max-w-md p-6">
      <Outlet />
    </main>
  ),
});
