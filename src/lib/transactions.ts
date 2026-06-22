import { useEffect, useState, useCallback } from "react";
import { getCurrentUser } from "./auth";

export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: TxType;
  date: string;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Shopping",
  "Travel",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other",
];

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Business", "Bonus", "Other"];

function txKey() {
  const u = getCurrentUser();
  return u ? `fa_tx_${u.id}` : "fa_tx_guest";
}
function budgetKey() {
  const u = getCurrentUser();
  return u ? `fa_budget_${u.id}` : "fa_budget_guest";
}

function read(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(txKey());
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function write(list: Transaction[]) {
  localStorage.setItem(txKey(), JSON.stringify(list));
  window.dispatchEvent(new Event("tx:changed"));
}

export function useTransactions() {
  const [items, setItems] = useState<Transaction[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("tx:changed", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("auth:changed", onChange);
    return () => {
      window.removeEventListener("tx:changed", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth:changed", onChange);
    };
  }, []);

  const add = useCallback((t: Omit<Transaction, "id">) => {
    const list = read();
    list.unshift({ ...t, id: crypto.randomUUID() });
    write(list);
  }, []);

  const addMany = useCallback((ts: Omit<Transaction, "id">[]) => {
    const list = read();
    const withIds = ts.map((t) => ({ ...t, id: crypto.randomUUID() }));
    write([...withIds, ...list]);
    return withIds.length;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => write([]), []);

  return { items, add, addMany, remove, clearAll };
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function exportCSV(items: Transaction[]) {
  const header = ["Title", "Category", "Amount", "Type", "Date"];
  const rows = items.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.category,
    t.amount.toString(),
    t.type,
    t.date,
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============= Budgets =============
export type Budgets = Record<string, number>; // category -> monthly limit

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budgets>({});

  const load = () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(budgetKey());
      setBudgets(raw ? JSON.parse(raw) : {});
    } catch { setBudgets({}); }
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("budget:changed", onChange);
    window.addEventListener("auth:changed", onChange);
    return () => {
      window.removeEventListener("budget:changed", onChange);
      window.removeEventListener("auth:changed", onChange);
    };
  }, []);

  const save = useCallback((b: Budgets) => {
    localStorage.setItem(budgetKey(), JSON.stringify(b));
    setBudgets(b);
    window.dispatchEvent(new Event("budget:changed"));
  }, []);

  return { budgets, save };
}
