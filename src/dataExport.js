import { strToU8, zipSync } from "fflate";
import { supabase } from "./supabaseClient";

const cell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// The leading BOM makes Excel open Arabic and other non-English text correctly.
const toCsv = (headers, rows) => "\ufeff" + [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");

const MOVEMENT_LABELS = {
  initial: "Opening stock",
  restock: "Stock added",
  sale: "Sold",
  sale_deleted: "Sale deleted",
  correction: "Correction",
};

export async function downloadAllData({ transactions, products, debts }) {
  const { data: movements, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw new Error(error.message);

  const productName = new Map(products.map((item) => [item.id, item.name]));

  const files = {
    "transactions.csv": toCsv(
      ["Date", "Reference", "Description", "Customer", "Type", "Category", "Amount", "Quantity sold"],
      transactions.map((t) => [t.occurredOn, t.ref, t.name, t.customer, t.type, t.category, t.amount, t.quantity ?? ""])
    ),
    "products.csv": toCsv(
      ["Product", "Reference", "Category", "Stocked", "Sold", "In stock", "Unit price"],
      products.map((p) => [p.name, p.ref, p.category, p.stocked, p.sold, p.stock, p.price])
    ),
    "debts.csv": toCsv(
      ["Customer", "What for", "Amount", "Paid", "Remaining", "Due date", "Recorded on"],
      debts.map((d) => [d.customer, d.note, d.amount, d.paid, Math.max(d.amount - d.paid, 0), d.dueDate, d.createdAt])
    ),
    "stock_history.csv": toCsv(
      ["Date", "Product", "What happened", "Change", "Left", "Note"],
      movements.map((m) => [
        m.created_at.slice(0, 10),
        productName.get(m.product_id) || "",
        MOVEMENT_LABELS[m.kind] || m.kind,
        m.change,
        m.stock_after,
        m.note,
      ])
    ),
    "README.txt": "Your BizTrack data.\r\nOpen the .csv files with Excel or Google Sheets.\r\nExported on " + new Date().toISOString().slice(0, 10) + ".\r\n",
  };

  const zipped = zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
  const url = URL.createObjectURL(new Blob([zipped], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `biztrack-data-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
