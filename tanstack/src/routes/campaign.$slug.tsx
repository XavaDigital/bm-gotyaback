import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/campaign/$slug")({
  component: () => <Outlet />,
});
