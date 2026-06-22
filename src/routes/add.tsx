import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TxType } from "@/lib/transactions";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add Transaction — FinAudit" }] }),
  component: AddPage,
});

function AddPage() {
  const { add } = useTransactions();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!title.trim()) return toast.error("Title is required");
    if (!amount || isNaN(amt) || amt <= 0) return toast.error("Amount must be greater than zero");
    if (!category) return toast.error("Select a category");
    if (!date) return toast.error("Date is required");

    add({ title: title.trim(), amount: amt, type, category, date });
    toast.success("Transaction added");
    setTitle(""); setAmount(""); setCategory(""); setDate(new Date().toISOString().slice(0, 10)); setType("expense");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grocery shopping" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => { setType(v as TxType); setCategory(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">Add Transaction</Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/transactions" })}>View all</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
