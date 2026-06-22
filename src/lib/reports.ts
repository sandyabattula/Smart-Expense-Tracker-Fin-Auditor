import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction } from "./transactions";
import { formatCurrency } from "./transactions";

export function exportPDF(items: Transaction[], userName?: string) {
  const doc = new jsPDF();
  const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text("FinAudit — Financial Report", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  if (userName) doc.text(`Account: ${userName}`, 14, 32);

  doc.setFontSize(11);
  const y = userName ? 42 : 36;
  doc.text(`Total Income:   ${formatCurrency(income)}`, 14, y);
  doc.text(`Total Expense:  ${formatCurrency(expense)}`, 14, y + 6);
  doc.text(`Net Balance:    ${formatCurrency(balance)}`, 14, y + 12);

  autoTable(doc, {
    startY: y + 20,
    head: [["Date", "Title", "Category", "Type", "Amount"]],
    body: items.map((t) => [
      t.date,
      t.title,
      t.category,
      t.type,
      `${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}`,
    ]),
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  });

  doc.save(`finaudit-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
