import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTransactions, useBudgets, formatCurrency, EXPENSE_CATEGORIES } from "@/lib/transactions";
import { TrendingUp, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/budgets")({
  head: () => ({ meta: [{ title: "Budgets & Forecast — FinAudit" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const { items } = useTransactions();
  const { budgets, save } = useBudgets();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const d: Record<string, string> = {};
    EXPENSE_CATEGORIES.forEach((c) => { d[c] = budgets[c] != null ? String(budgets[c]) : ""; });
    setDraft(d);
  }, [budgets]);

  const month = new Date().toISOString().slice(0, 7);
  const monthSpend = useMemo(() => {
    const m: Record<string, number> = {};
    items.filter((t) => t.type === "expense" && t.date.startsWith(month)).forEach((t) => {
      m[t.category] = (m[t.category] ?? 0) + t.amount;
    });
    return m;
  }, [items, month]);

  // Forecast: average of last 3 months expense per category, projected to month end
  const forecast = useMemo(() => {
    const byMonthCat: Record<string, Record<string, number>> = {};
    items.filter((t) => t.type === "expense").forEach((t) => {
      const m = t.date.slice(0, 7);
      byMonthCat[m] = byMonthCat[m] ?? {};
      byMonthCat[m][t.category] = (byMonthCat[m][t.category] ?? 0) + t.amount;
    });
    const months = Object.keys(byMonthCat).filter((m) => m < month).sort().slice(-3);
    const out: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      if (months.length === 0) { out[c] = monthSpend[c] ?? 0; return; }
      const avg = months.reduce((s, m) => s + (byMonthCat[m][c] ?? 0), 0) / months.length;
      // Use the higher of (avg) and (current month spend extrapolated)
      const now = new Date();
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const extrapolated = ((monthSpend[c] ?? 0) / Math.max(dayOfMonth, 1)) * daysInMonth;
      out[c] = Math.max(avg, extrapolated);
    });
    return out;
  }, [items, month, monthSpend]);

  function persist() {
    const next: Record<string, number> = {};
    for (const c of EXPENSE_CATEGORIES) {
      const v = Number(draft[c]);
      if (!isNaN(v) && v > 0) next[c] = v;
    }
    save(next);
    toast.success("Budgets saved");
  }

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = Object.values(monthSpend).reduce((s, v) => s + v, 0);
  const totalForecast = Object.values(forecast).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total budget" value={formatCurrency(totalBudget)} />
        <StatCard label={`Spent in ${month}`} value={formatCurrency(totalSpent)} />
        <StatCard label="Forecast (month-end)" value={formatCurrency(totalForecast)} accent />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Category limits & spending</CardTitle>
          <CardDescription>Set a monthly limit per category. We'll warn you when you're close.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {EXPENSE_CATEGORIES.map((c) => {
            const limit = budgets[c] ?? 0;
            const spent = monthSpend[c] ?? 0;
            const fc = forecast[c] ?? 0;
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const over = limit > 0 && spent > limit;
            const warn = limit > 0 && !over && fc > limit;
            return (
              <div key={c} className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Label className="w-28">{c}</Label>
                  <Input
                    type="number" min="0" step="1"
                    className="w-40"
                    placeholder="No limit"
                    value={draft[c] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [c]: e.target.value })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Spent {formatCurrency(spent)}{limit > 0 && ` of ${formatCurrency(limit)}`} • Forecast {formatCurrency(fc)}
                  </span>
                  {over && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"><AlertTriangle className="h-3 w-3" />Over limit</span>}
                  {warn && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary"><AlertTriangle className="h-3 w-3" />Trending over</span>}
                </div>
                {limit > 0 && <Progress value={pct} />}
              </div>
            );
          })}
          <Button onClick={persist}><Save className="h-4 w-4" /> Save budgets</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
