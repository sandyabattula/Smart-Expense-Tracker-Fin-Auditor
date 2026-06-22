import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, formatCurrency } from "@/lib/transactions";
import { Wallet, TrendingUp, TrendingDown, Receipt, Sparkles, Brain, FileText, Cloud, Lock } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — FinAudit" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { items } = useTransactions();
  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const stats = [
    { label: "Total Balance", value: formatCurrency(balance), icon: Wallet, accent: true },
    { label: "Total Income", value: formatCurrency(income), icon: TrendingUp },
    { label: "Total Expenses", value: formatCurrency(expense), icon: TrendingDown },
    { label: "Transactions", value: items.length.toString(), icon: Receipt },
  ];

  const recent = items.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`mt-2 text-2xl font-semibold ${s.accent ? "text-primary" : ""}`}>{s.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Button asChild variant="outline" size="sm"><Link to="/transactions">View all</Link></Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState description="Add your first transaction to get started." />
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category} • {t.date}</p>
                  </div>
                  <span className={t.type === "income" ? "text-primary font-semibold" : "font-semibold"}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Future Enhancements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Brain, t: "Budget Prediction using AI" },
              { icon: Sparkles, t: "Expense Recommendation System" },
              { icon: FileText, t: "PDF Reports" },
              { icon: Lock, t: "User Authentication" },
              { icon: Cloud, t: "Cloud Sync" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{f.t}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
