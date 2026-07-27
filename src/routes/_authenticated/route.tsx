import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("taj_mock_clerk_user") : null;
    if (!savedUser) {
      throw redirect({ to: "/auth", search: { mode: "login" } });
    }
    try {
      const user = JSON.parse(savedUser);
      return { user };
    } catch {
      throw redirect({ to: "/auth", search: { mode: "login" } });
    }
  },
  component: () => <Outlet />,
});
