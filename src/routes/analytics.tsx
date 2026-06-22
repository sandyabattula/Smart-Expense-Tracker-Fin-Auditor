import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions, formatCurrency } from "@/lib/transactions";
import { EmptyState } from "@/components/EmptyState";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — FinAudit" }] }),
  component: AnalyticsPage,
});

const COLORS = ["#2563EB", "#60A5FA", "#1E40AF", "#93C5FD", "#3B82F6", "#1D4ED8", "#BFDBFE", "#0F172A"];

function AnalyticsPage() {
  const { items } = useTransactions();

  const byCat = Object.values(
    items.filter((t) => t.type === "expense").reduce<Record<string, { name: string; value: number }>>((acc, t) => {
      acc[t.category] = acc[t.category] || { name: t.category, value: 0 };
      acc[t.category].value += t.amount;
      return acc;
    }, {})
  );

  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const compare = [{ name: "Income", value: income }, { name: "Expense", value: expense }];

  if (items.length === 0) {
    return <Card className="shadow-card"><CardContent><EmptyState description="Add transactions to see analytics." /></CardContent></Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
        <CardContent className="h-80">
          {byCat.length === 0 ? <EmptyState description="No expenses yet." /> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" outerRadius={100} label={(e) => e.name}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Income vs Expense</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
