import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions, formatCurrency, type Transaction } from "@/lib/transactions";
import { categorize } from "@/lib/categorize";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [{ title: "Import Statement — FinAudit" }] }),
  component: ImportPage,
});

type Parsed = Omit<Transaction, "id">;

function parseCSV(text: string): Parsed[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const split = (line: string) => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const findIdx = (...names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));

  const dateIdx = findIdx("date");
  const descIdx = findIdx("description", "details", "narration", "title", "memo", "payee");
  const amtIdx = findIdx("amount", "value");
  const debitIdx = findIdx("debit", "withdrawal");
  const creditIdx = findIdx("credit", "deposit");
  const typeIdx = findIdx("type");

  if (dateIdx === -1 || (descIdx === -1) || (amtIdx === -1 && debitIdx === -1 && creditIdx === -1)) {
    throw new Error("CSV must include Date, Description, and Amount (or Debit/Credit) columns");
  }

  const results: Parsed[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const rawDate = cols[dateIdx];
    const desc = cols[descIdx] ?? "Transaction";
    if (!rawDate || !desc) continue;

    let amount = 0;
    let type: "income" | "expense" = "expense";

    if (amtIdx !== -1) {
      const raw = (cols[amtIdx] ?? "").replace(/[$,\s]/g, "");
      const n = Number(raw);
      if (isNaN(n) || n === 0) continue;
      amount = Math.abs(n);
      type = n >= 0 ? "income" : "expense";
      if (typeIdx !== -1) {
        const t = (cols[typeIdx] ?? "").toLowerCase();
        if (t.includes("credit") || t.includes("income") || t.includes("deposit")) type = "income";
        else if (t.includes("debit") || t.includes("expense") || t.includes("withdraw")) type = "expense";
      }
    } else {
      const debit = Number((cols[debitIdx] ?? "0").replace(/[$,\s]/g, "")) || 0;
      const credit = Number((cols[creditIdx] ?? "0").replace(/[$,\s]/g, "")) || 0;
      if (credit > 0) { amount = credit; type = "income"; }
      else if (debit > 0) { amount = debit; type = "expense"; }
      else continue;
    }

    const d = new Date(rawDate);
    const date = isNaN(d.getTime()) ? rawDate : d.toISOString().slice(0, 10);

    results.push({
      title: desc.slice(0, 80),
      amount,
      type,
      category: categorize(desc, type),
      date,
    });
  }
  return results;
}

function ImportPage() {
  const { addMany } = useTransactions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed[]>([]);
  const [fileName, setFileName] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error("No valid rows found"); return; }
      setParsed(rows);
      toast.success(`Parsed ${rows.length} transactions`);
    } catch (err) {
      toast.error((err as Error).message);
      setParsed([]);
    }
  }

  function confirm() {
    if (parsed.length === 0) return;
    const n = addMany(parsed);
    toast.success(`Imported ${n} transactions`);
    setParsed([]); setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" />Import bank statement</CardTitle>
          <CardDescription>
            Upload a CSV exported from your bank. We'll auto-categorize each line based on the description.
            Supported columns: Date, Description, Amount (positive = income, negative = expense), or separate Debit/Credit columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => inputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4" /> Choose CSV file
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Example header: <code>Date,Description,Amount</code> — e.g. <code>2026-06-01,Starbucks Coffee,-5.40</code>
          </div>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Preview ({parsed.length} rows)</CardTitle>
            <Button onClick={confirm}>
              <CheckCircle2 className="h-4 w-4" /> Confirm import
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 50).map((t, i) => (
                    <TableRow key={i}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>{t.type}</TableCell>
                      <TableCell className={`text-right font-semibold ${t.type === "income" ? "text-primary" : ""}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsed.length > 50 && <p className="mt-3 text-xs text-muted-foreground">Showing first 50 of {parsed.length}.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
