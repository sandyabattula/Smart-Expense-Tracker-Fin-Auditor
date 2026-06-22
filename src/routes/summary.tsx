import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactions, formatCurrency } from "@/lib/transactions";
import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "Monthly Summary — FinAudit" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const { items } = useTransactions();
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  const inMonth = items.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });
  const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;
  const pct = income > 0 ? (savings / income) * 100 : 0;

  const stats = [
    { label: "Month Income", value: formatCurrency(income), icon: TrendingUp },
    { label: "Month Expense", value: formatCurrency(expense), icon: TrendingDown },
    { label: "Total Savings", value: formatCurrency(savings), icon: PiggyBank, accent: true },
    { label: "Savings %", value: `${pct.toFixed(1)}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
