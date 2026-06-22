import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransactions, EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency, exportCSV } from "@/lib/transactions";
import { exportPDF } from "@/lib/reports";
import { useAuth } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { Trash2, Download, Search, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions — FinAudit" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { items, remove } = useTransactions();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const allCats = ["all", ...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (catFilter !== "all" && t.category !== catFilter) return false;
      return true;
    });
  }, [items, search, typeFilter, catFilter]);

  function confirmDelete() {
    if (pendingDelete) {
      remove(pendingDelete);
      toast.success("Transaction deleted");
      setPendingDelete(null);
    }
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>All Transactions</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportCSV(items)} disabled={items.length === 0} variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => exportPDF(items, user?.name)} disabled={items.length === 0} variant="outline" size="sm">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {allCats.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className={t.type === "income" ? "text-primary font-semibold" : "font-semibold"}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.type === "income" ? "bg-accent text-primary" : "bg-muted text-foreground"}`}>
                        {t.type}
                      </span>
                    </TableCell>
                    <TableCell>{t.date}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setPendingDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
