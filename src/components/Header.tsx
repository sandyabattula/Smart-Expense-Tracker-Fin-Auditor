import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouterState, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/add": "Add Transaction",
  "/import": "Import Statement",
  "/transactions": "Transactions",
  "/budgets": "Budgets & Forecast",
  "/analytics": "Analytics",
  "/summary": "Monthly Summary",
};

export function Header() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const router = useRouter();
  const { user, logout } = useAuth();
  const title = titles[pathname] ?? "FinAudit";

  function onLogout() {
    logout();
    router.navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name}
          </span>
        )}
        {user && (
          <Button size="sm" variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        )}
      </div>
    </header>
  );
}
