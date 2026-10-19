
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import OwnerClients from "./Owner.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import PaymentInfo from "./PaymentInfo.jsx";
import { OWNER_CONTACT, OWNER_WHATSAPP_LINK } from "./config";
import { useTheme } from "./theme";
import { CURRENCIES, formatAxis, formatMoney } from "./currency";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  Users,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingCart,
  CreditCard,
  Menu,
  X,
  Download,
  ChevronDown,
  CircleHelp,
  TrendingUp,
  MoreHorizontal,
  Boxes,
  Check,
  HandCoins,
  Trash2,
  LogOut,
  ShieldCheck,
  Globe,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";
import "./Help.css";

const today = () => new Date().toISOString().slice(0, 10);

function debtStatus(debt) {
  const outstanding = debt.amount - debt.paid;
  if (outstanding <= 0) return "Paid";
  if (debt.dueDate && debt.dueDate < today()) return "Overdue";
  return debt.paid > 0 ? "Partial" : "Unpaid";
}

const TRANSACTION_CATEGORIES = ["Sales", "Services", "Products", "Stock purchase", "Rent", "Salaries", "Transport", "Utilities", "Marketing", "Other"];
const PRODUCT_CATEGORIES = ["Electronics", "Accessories", "Food", "Clothing", "Beauty", "Office", "Stationery", "Other"];

const localToday = () => new Date().toLocaleDateString("en-CA");

const blankTransaction = () => ({
  name: "",
  nameAuto: false,
  customer: "",
  amount: "",
  type: "Income",
  category: "Sales",
  date: localToday(),
  productId: "",
  quantity: "1",
});

const withCurrent = (list, current) => (current && !list.includes(current) ? [current, ...list] : list);
const sortByDate = (list) => [...list].sort((a, b) => (b.occurredOn || "").localeCompare(a.occurredOn || ""));

function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

const fromTransactionRow = (row) => ({
  id: row.id,
  ref: row.ref,
  name: row.name,
  customer: row.customer,
  amount: Number(row.amount),
  type: row.type,
  status: row.status,
  category: row.category,
  occurredOn: row.occurred_on,
  date: formatDate(row.occurred_on),
  productId: row.product_id,
  quantity: row.quantity,
});

const fromProductRow = (row) => ({
  id: row.id,
  ref: row.ref,
  name: row.name,
  category: row.category,
  stock: Number(row.stock),
  price: Number(row.price),
});

const fromDebtRow = (row) => ({
  id: row.id,
  ref: row.ref,
  customer: row.customer,
  note: row.note,
  amount: Number(row.amount),
  paid: Number(row.paid),
  dueDate: row.due_date || "",
  createdAt: formatDate(row.created_on),
});

function App({ user, profile, isOwner, onSignOut, onViewLanding, requestedPage }) {
  const [activePage, setActivePage] = useState("Overview");
  const [handledRequest, setHandledRequest] = useState(0);
  if (requestedPage && requestedPage.id !== handledRequest) {
    setHandledRequest(requestedPage.id);
    setActivePage(requestedPage.page);
  }
  const [currency, setCurrency] = useState(profile?.currency || "USD");
  const [theme] = useTheme();
  const money = (amount) => formatMoney(amount, currency);
  const axisMoney = (value) => formatAxis(value, currency);
  const chart = theme === "dark"
    ? { grid: "#262a4a", tick: "#8a90b5", tooltip: { background: "#1b1e3d", border: "1px solid #2a2e52", borderRadius: 12, color: "#e8eaf6" } }
    : { grid: "#eef0f6", tick: "#9298a9", tooltip: { border: "1px solid #eceef5", borderRadius: 12, boxShadow: "0 8px 24px #20223b12" } };
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState({ customer: "", note: "", amount: "", dueDate: "" });
  const [paymentDebt, setPaymentDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("Last 6 months");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("All");
  const [newTransaction, setNewTransaction] = useState(blankTransaction);
  const [todayStr] = useState(localToday);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionForm, setTransactionForm] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Electronics",
    stock: "",
    price: "",
  });

  const businessName = profile?.business_name || user?.email?.split("@")[0] || "My business";
  const initials = businessName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const [loadedAt] = useState(() => Date.now());
  const daysLeft = Math.max(0, Math.ceil((new Date(profile?.trial_ends_at) - loadedAt) / 86400000 - 0.01));
  const planLabel = profile?.plan === "active"
    ? (profile?.paid_until ? `Active until ${formatDate(profile.paid_until.slice(0, 10))}` : "Active plan")
    : `Free trial · ${daysLeft} days left`;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tx, pr, db] = await Promise.all([
        supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("debts").select("*").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      const failure = tx.error || pr.error || db.error;
      if (failure) {
        setLoadError(failure.message);
      } else {
        setTransactions(tx.data.map(fromTransactionRow));
        setProducts(pr.data.map(fromProductRow));
        setDebts(db.data.map(fromDebtRow));
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const monthlyData = useMemo(() => {
    const now = new Date(loadedAt);
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: d.toLocaleDateString("en-US", { month: "short" }),
        income: 0,
        expenses: 0,
      });
    }
    transactions.forEach((item) => {
      const bucket = buckets.find((entry) => entry.key === (item.occurredOn || "").slice(0, 7));
      if (!bucket) return;
      if (item.amount > 0) bucket.income += item.amount;
      else bucket.expenses += Math.abs(item.amount);
    });
    return buckets;
  }, [transactions, loadedAt]);

  const incomeBreakdown = useMemo(() => {
    const byCategory = new Map();
    transactions.filter((item) => item.amount > 0).forEach((item) => {
      byCategory.set(item.category, (byCategory.get(item.category) || 0) + item.amount);
    });
    return [...byCategory.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.amount > 0)
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => item.amount < 0)
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return { income, expenses, profit: income - expenses };
  }, [transactions]);

  const filteredTransactions = transactions.filter((item) => {
    const matchesSearch = [
      item.ref,
      item.name,
      item.customer,
      item.category,
      item.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      transactionFilter === "All" || item.type === transactionFilter;

    return matchesSearch && matchesFilter;
  });

  const filteredProducts = products.filter((item) =>
    `${item.ref} ${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  async function changeCurrency(next) {
    const previous = currency;
    setCurrency(next);
    const { error } = await supabase.from("profiles").update({ currency: next }).eq("id", user.id);
    if (error) {
      setCurrency(previous);
      notify(error.message);
    } else {
      notify("Currency updated.");
    }
  }

  function changeNewTransaction(patch) {
    setNewTransaction((current) => {
      const next = { ...current, ...patch };
      if (next.type === "Expense") next.productId = "";
      if (next.type === "Income" && next.productId && ("productId" in patch || "quantity" in patch)) {
        const product = products.find((item) => item.id === next.productId);
        if (product) {
          const quantity = Math.max(1, Math.round(Number(next.quantity) || 1));
          next.amount = String(Math.round(product.price * quantity * 100) / 100);
          if (!current.name.trim() || current.nameAuto) {
            next.name = `${product.name} x${quantity}`;
            next.nameAuto = true;
          }
        }
      }
      return next;
    });
  }

  async function addTransaction(event) {
    event.preventDefault();
    const value = Number(newTransaction.amount);

    if (!newTransaction.name.trim() || !newTransaction.amount || value <= 0) {
      notify("Enter a transaction name and a valid amount.");
      return;
    }

    const ref = `TXN-${Date.now().toString().slice(-6)}`;
    const productSale = newTransaction.type === "Income" && newTransaction.productId;
    let row;
    let failure;

    if (productSale) {
      const product = products.find((item) => item.id === newTransaction.productId);
      const quantity = Math.round(Number(newTransaction.quantity));
      if (!product || !quantity || quantity < 1) {
        notify("Enter how many units were sold.");
        return;
      }
      if (quantity > product.stock) {
        notify(`Only ${product.stock} of ${product.name} in stock.`);
        return;
      }
      const result = await supabase.rpc("record_sale", {
        p_product: product.id,
        p_quantity: quantity,
        p_name: newTransaction.name.trim(),
        p_customer: newTransaction.customer.trim(),
        p_amount: value,
        p_category: newTransaction.category,
        p_ref: ref,
        p_date: newTransaction.date,
      });
      row = result.data;
      failure = result.error;
      if (!failure) {
        setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, stock: item.stock - quantity } : item)));
      }
    } else {
      const result = await supabase
        .from("transactions")
        .insert({
          ref,
          name: newTransaction.name.trim(),
          customer: newTransaction.customer.trim() || "Unspecified",
          amount: newTransaction.type === "Expense" ? -value : value,
          type: newTransaction.type,
          status: "Completed",
          category: newTransaction.category,
          occurred_on: newTransaction.date,
        })
        .select()
        .single();
      row = result.data;
      failure = result.error;
    }

    if (failure) {
      notify(failure.message);
      return;
    }

    setTransactions((current) => sortByDate([fromTransactionRow(row), ...current]));
    setNewTransaction(blankTransaction());
    setShowTransactionForm(false);
    notify(productSale ? "Sale recorded and stock updated." : "Transaction added successfully.");
  }

  function openEditTransaction(item) {
    setEditingTransaction(item);
    setTransactionForm({
      name: item.name,
      customer: item.customer === "Unspecified" ? "" : item.customer,
      amount: String(Math.abs(item.amount)),
      type: item.type,
      category: item.category,
      date: item.occurredOn,
    });
  }

  async function saveTransactionEdit(event) {
    event.preventDefault();
    const value = Number(transactionForm.amount);
    if (!transactionForm.name.trim() || !value || value <= 0) {
      notify("Enter a description and a valid amount.");
      return;
    }
    const { data, error } = await supabase
      .from("transactions")
      .update({
        name: transactionForm.name.trim(),
        customer: transactionForm.customer.trim() || "Unspecified",
        amount: transactionForm.type === "Expense" ? -value : value,
        type: transactionForm.type,
        category: transactionForm.category,
        occurred_on: transactionForm.date,
      })
      .eq("id", editingTransaction.id)
      .select()
      .single();
    if (error) {
      notify(error.message);
      return;
    }
    setTransactions((current) => sortByDate(current.map((item) => (item.id === data.id ? fromTransactionRow(data) : item))));
    setEditingTransaction(null);
    setTransactionForm(null);
    notify("Transaction updated.");
  }

  async function deleteTransaction(item) {
    let message = `Delete "${item.name}"? This cannot be undone.`;
    if (item.productId && item.quantity) message = `Delete "${item.name}"? The ${item.quantity} unit(s) will be added back to your stock.`;
    if (item.category === "Debt payment") message += " The customer's debt will not change.";
    if (!window.confirm(message)) return;
    const { error } = await supabase.rpc("delete_transaction", { p_id: item.id });
    if (error) {
      notify(error.message);
      return;
    }
    setTransactions((current) => current.filter((entry) => entry.id !== item.id));
    if (item.productId && item.quantity) {
      setProducts((current) => current.map((product) => (product.id === item.productId ? { ...product, stock: product.stock + item.quantity } : product)));
    }
    notify("Transaction deleted.");
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setProductForm({ name: product.name, category: product.category, stock: String(product.stock), price: String(product.price) });
  }

  async function saveProductEdit(event) {
    event.preventDefault();
    if (!productForm.name.trim() || productForm.stock === "" || productForm.price === "" || Number(productForm.stock) < 0 || Number(productForm.price) < 0) {
      notify("Complete all product fields with valid values.");
      return;
    }
    const { data, error } = await supabase
      .from("products")
      .update({
        name: productForm.name.trim(),
        category: productForm.category,
        stock: Math.round(Number(productForm.stock)),
        price: Number(productForm.price),
      })
      .eq("id", editingProduct.id)
      .select()
      .single();
    if (error) {
      notify(error.message);
      return;
    }
    setProducts((current) => current.map((item) => (item.id === data.id ? fromProductRow(data) : item)));
    setEditingProduct(null);
    setProductForm(null);
    notify("Product updated.");
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}? Your past sales of it are kept.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      notify(error.message);
      return;
    }
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setTransactions((current) => current.map((item) => (item.productId === product.id ? { ...item, productId: null, quantity: null } : item)));
    notify("Product deleted.");
  }

  async function addDebt(event) {
    event.preventDefault();
    const value = Number(newDebt.amount);

    if (!newDebt.customer.trim() || !value || value <= 0) {
      notify("Enter a customer name and a valid amount.");
      return;
    }

    const { data, error } = await supabase
      .from("debts")
      .insert({
        ref: `DBT-${Date.now().toString().slice(-6)}`,
        customer: newDebt.customer.trim(),
        note: newDebt.note.trim(),
        amount: value,
        due_date: newDebt.dueDate || null,
      })
      .select()
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setDebts((current) => [fromDebtRow(data), ...current]);
    setNewDebt({ customer: "", note: "", amount: "", dueDate: "" });
    setShowDebtForm(false);
    notify("Debt recorded.");
  }

  async function recordPayment(event) {
    event.preventDefault();
    const value = Number(paymentAmount);
    const outstanding = paymentDebt.amount - paymentDebt.paid;

    if (!value || value <= 0 || value > outstanding + 0.001) {
      notify(`Enter an amount between 0.01 and ${money(outstanding)}.`);
      return;
    }

    const newPaid = Math.round((paymentDebt.paid + value) * 100) / 100;
    const { data: updated, error: updateError } = await supabase
      .from("debts")
      .update({ paid: newPaid })
      .eq("id", paymentDebt.id)
      .select()
      .single();

    if (updateError) {
      notify(updateError.message);
      return;
    }

    const { data: payment, error: paymentError } = await supabase
      .from("transactions")
      .insert({
        ref: `TXN-${Date.now().toString().slice(-6)}`,
        name: `Debt payment${paymentDebt.note ? ` - ${paymentDebt.note}` : ""}`,
        customer: paymentDebt.customer,
        amount: value,
        type: "Income",
        status: "Completed",
        category: "Debt payment",
      })
      .select()
      .single();

    setDebts((current) => current.map((debt) => (debt.id === updated.id ? fromDebtRow(updated) : debt)));
    if (paymentError) {
      notify("Payment saved, but it could not be added to your income: " + paymentError.message);
    } else {
      setTransactions((current) => [fromTransactionRow(payment), ...current]);
      notify("Payment recorded and added to your income.");
    }
    setPaymentDebt(null);
    setPaymentAmount("");
  }

  async function deleteDebt(debt) {
    if (!window.confirm(`Delete the debt for ${debt.customer}? This cannot be undone.`)) return;
    const { error } = await supabase.from("debts").delete().eq("id", debt.id);
    if (error) {
      notify(error.message);
      return;
    }
    setDebts((current) => current.filter((item) => item.id !== debt.id));
    notify("Debt deleted.");
  }

  async function addProduct(event) {
    event.preventDefault();

    if (
      !newProduct.name.trim() ||
      newProduct.stock === "" ||
      newProduct.price === "" ||
      Number(newProduct.stock) < 0 ||
      Number(newProduct.price) < 0
    ) {
      notify("Complete all product fields with valid values.");
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        ref: `PRD-${String(Date.now()).slice(-5)}`,
        name: newProduct.name.trim(),
        category: newProduct.category,
        stock: Math.round(Number(newProduct.stock)),
        price: Number(newProduct.price),
      })
      .select()
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setProducts((current) => [fromProductRow(data), ...current]);
    setNewProduct({ name: "", category: "Electronics", stock: "", price: "" });
    setShowProductForm(false);
    notify("Product added successfully.");
  }

  function exportTransactions() {
    const rows = [
      ["ID", "Description", "Customer", "Date", "Type", "Amount", "Status", "Category"],
      ...filteredTransactions.map((item) => [
        item.ref,
        item.name,
        item.customer,
        item.date,
        item.type,
        item.amount,
        item.status,
        item.category,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "biztrack-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Transaction report exported.");
  }

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Transactions", icon: ArrowLeftRight },
    { label: "Inventory", icon: Package },
    { label: "Customers", icon: Users },
    { label: "Debts", icon: HandCoins },
    { label: "Analytics", icon: ChartNoAxesCombined },
    ...(isOwner ? [{ label: "Clients", icon: ShieldCheck }] : []),
  ];

  const pageDescriptions = {
    Overview: "Here's what's happening with your business today.",
    Transactions: "Track and manage your business income and expenses.",
    Inventory: "Keep your products and stock levels under control.",
    Customers: "Review the customers linked to your transactions.",
    Debts: "Track who owes you money and record payments as they come in.",
    Analytics: "Understand your business performance at a glance.",
    Help: "Quick answers and a direct line to us.",
    Clients: "Owner only: see every account and activate paying clients.",
    Settings: "Manage your BizTrack workspace preferences.",
  };

  function changePage(page) {
    setActivePage(page);
    setSearch("");
    setMenuOpen(false);
  }

  function renderOverview() {
    return (
      <>
        <section className="metrics-grid">
          <MetricCard
            title="Total revenue"
            amount={money(totals.income)}
            change="Live total"
            caption="From your records"
            icon={Wallet}
            color="violet"
          />
          <MetricCard
            title="Total expenses"
            amount={money(totals.expenses)}
            change="Live total"
            caption="From your records"
            icon={CreditCard}
            color="orange"
            down
          />
          <MetricCard
            title="Net profit"
            amount={money(totals.profit)}
            change="Live total"
            caption="From your records"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Transactions"
            amount={String(transactions.length).padStart(2, "0")}
            change="Live total"
            caption="Recorded transactions"
            icon={ShoppingCart}
            color="blue"
          />
        </section>

        <section className="charts-grid">
          <div className="panel revenue-panel">
            <div className="panel-heading">
              <div>
                <h2>Revenue overview</h2>
                <p>Track your income and expenses over time</p>
              </div>
              <select
                className="period-select"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                aria-label="Chart period"
              >
                <option>Last 6 months</option>
                <option>Last 30 days</option>
                <option>This year</option>
              </select>
            </div>

            <div className="chart-legend">
              <span><i className="legend-dot revenue-dot" /> Revenue</span>
              <span><i className="legend-dot expense-dot" /> Expenses</span>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7667f8" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#7667f8" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f4a261" stopOpacity={0.17} />
                      <stop offset="100%" stopColor="#f4a261" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={chart.grid} strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} tickFormatter={axisMoney} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={chart.tooltip} />
                  <Area type="monotone" dataKey="income" name="Revenue" stroke="#7667f8" strokeWidth={2.5} fill="url(#revenueGradient)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f4a261" strokeWidth={2.5} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel breakdown-panel">
            <div className="panel-heading">
              <div>
                <h2>Income breakdown</h2>
                <p>By business category</p>
              </div>
              <button className="icon-button" onClick={() => changePage("Analytics")} aria-label="Open analytics">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="breakdown-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeBreakdown} margin={{ top: 12, right: 0, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 10 }} tickFormatter={axisMoney} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={chart.tooltip} />
                  <Bar dataKey="value" name="Income" fill="#7667f8" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="breakdown-total">
              <span>Recorded income</span>
              <strong>{money(totals.income)}</strong>
            </div>
          </div>
        </section>

        <TransactionTable money={money}
          items={filteredTransactions.slice(0, 5)}
          onViewAll={() => changePage("Transactions")}
        />
      </>
    );
  }

  function renderTransactions() {
    return (
      <section className="panel table-panel full-table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h2>All transactions</h2>
            <p>{filteredTransactions.length} records found</p>
          </div>
          <div className="table-actions">
            <select
              className="period-select"
              value={transactionFilter}
              onChange={(event) => setTransactionFilter(event.target.value)}
              aria-label="Filter transactions"
            >
              <option>All</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
            <button className="secondary-button" onClick={exportTransactions}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
        <TransactionTable money={money} items={filteredTransactions} onEdit={openEditTransaction} onDelete={deleteTransaction} />
      </section>
    );
  }

  function renderInventory() {
    return (
      <section className="panel table-panel full-table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h2>Product inventory</h2>
            <p>{products.length} products in your catalog</p>
          </div>
          <button className="primary-button" onClick={() => setShowProductForm(true)}>
            <Plus size={17} /> Add product
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Product ID</th>
                <th>Category</th>
                <th>Stock level</th>
                <th>Unit price</th>
                <th>Stock status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td><div className="transaction-name"><span className="product-icon"><Boxes size={17} /></span><strong>{product.name}</strong></div></td>
                  <td className="muted-cell">{product.ref}</td>
                  <td>{product.category}</td>
                  <td>{product.stock} units</td>
                  <td className="amount-cell">{money(product.price)}</td>
                  <td><span className={`status-pill ${product.stock < 10 ? "status-pending" : "status-completed"}`}>{product.stock < 10 ? "Low stock" : "In stock"}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => openEditProduct(product)} aria-label={`Edit ${product.name}`} title="Edit"><Pencil size={16} /></button>
                      <button className="icon-button" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && <EmptyRow message="No products match your search." />}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderCustomers() {
    const customerMap = new Map();

    transactions.forEach((item) => {
      if (!item.customer || item.customer === "Unspecified" || item.type === "Expense") return;
      const current = customerMap.get(item.customer) || { name: item.customer, total: 0, count: 0, lastDate: item.date };
      current.total += item.amount;
      current.count += 1;
      customerMap.set(item.customer, current);
    });

    const customers = [...customerMap.values()];

    return (
      <section className="panel table-panel full-table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h2>Your customers</h2>
            <p>Customers appearing in your income records</p>
          </div>
          <span className="customer-count">{customers.length} customers</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Customer</th><th>Transactions</th><th>Total revenue</th><th>Last recorded date</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.name}>
                  <td><div className="customer-cell"><span className="avatar">{customer.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><strong>{customer.name}</strong></div></td>
                  <td>{customer.count}</td>
                  <td className="amount-cell">{money(customer.total)}</td>
                  <td className="muted-cell">{customer.lastDate}</td>
                </tr>
              ))}
              {customers.length === 0 && <EmptyRow message="Add income transactions with customer names to see customers here." />}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  function renderDebts() {
    const rows = debts.filter((debt) =>
      `${debt.ref} ${debt.customer} ${debt.note}`.toLowerCase().includes(search.toLowerCase())
    );
    const totalOwed = debts.reduce((sum, debt) => sum + Math.max(debt.amount - debt.paid, 0), 0);
    const totalCollected = debts.reduce((sum, debt) => sum + debt.paid, 0);
    const overdue = debts.filter((debt) => debtStatus(debt) === "Overdue");
    const overdueAmount = overdue.reduce((sum, debt) => sum + (debt.amount - debt.paid), 0);

    return (
      <>
        <section className="metrics-grid">
          <MetricCard title="Total owed to you" amount={money(totalOwed)} change="Outstanding" caption="Across all customers" icon={HandCoins} color="violet" />
          <MetricCard title="Overdue" amount={money(overdueAmount)} change={`${overdue.length} debts`} caption="Past their due date" icon={CreditCard} color="orange" down />
          <MetricCard title="Collected so far" amount={money(totalCollected)} change="Received" caption="Added to your income" icon={Wallet} color="green" />
          <MetricCard title="Open debts" amount={String(debts.filter((debt) => debtStatus(debt) !== "Paid").length)} change="Unpaid or partial" caption="Still to collect" icon={Users} color="blue" />
        </section>
        <section className="panel table-panel full-table-panel">
          <div className="panel-heading table-heading">
            <div>
              <h2>Customer debts</h2>
              <p>{debts.length} records</p>
            </div>
            <button className="primary-button" onClick={() => setShowDebtForm(true)}>
              <Plus size={17} /> Add debt
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Customer</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Due date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((debt) => {
                  const status = debtStatus(debt);
                  const remaining = Math.max(debt.amount - debt.paid, 0);
                  return (
                    <tr key={debt.id}>
                      <td><div className="transaction-name"><span className="product-icon"><HandCoins size={17} /></span><div><strong>{debt.customer}</strong><small>{debt.note || debt.ref}</small></div></div></td>
                      <td className="amount-cell">{money(debt.amount)}</td>
                      <td>{money(debt.paid)}</td>
                      <td className="amount-cell">{money(remaining)}</td>
                      <td className="muted-cell">{debt.dueDate || "-"}</td>
                      <td><span className={`status-pill ${status === "Paid" ? "status-completed" : "status-pending"}`}><i />{status}</span></td>
                      <td>
                        <div className="table-actions">
                          {status !== "Paid" && <button className="text-button" onClick={() => { setPaymentDebt(debt); setPaymentAmount(String(remaining)); }}>Record payment</button>}
                          <button className="icon-button" onClick={() => deleteDebt(debt)} aria-label={`Delete debt for ${debt.customer}`}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && <EmptyRow message="No debts yet. Click Add debt when a customer takes goods on credit." />}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function renderAnalytics() {
    return (
      <>
        <section className="metrics-grid">
          <MetricCard title="Recorded income" amount={money(totals.income)} change="Live total" caption="Based on your transactions" icon={Wallet} color="violet" />
          <MetricCard title="Recorded expenses" amount={money(totals.expenses)} change="Live total" caption="Based on your transactions" icon={CreditCard} color="orange" down />
          <MetricCard title="Net profit" amount={money(totals.profit)} change={totals.profit >= 0 ? "Positive" : "Negative"} caption="Income minus expenses" icon={TrendingUp} color="green" />
          <MetricCard title="Low stock products" amount={String(products.filter((product) => product.stock < 10).length)} change="Needs attention" caption="Fewer than 10 units" icon={Package} color="blue" />
        </section>
        <section className="panel analytics-panel">
          <div className="panel-heading"><div><h2>Monthly performance</h2><p>Income and expenses over the last 6 months</p></div></div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid stroke={chart.grid} strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 11 }} tickFormatter={axisMoney} />
                <Tooltip formatter={(value) => money(value)} contentStyle={chart.tooltip} />
                <Bar dataKey="income" name="Revenue" fill="#7667f8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f4a261" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </section>
      </>
    );
  }

  function renderHelp() {
    const whatsapp = `${OWNER_WHATSAPP_LINK}?text=${encodeURIComponent(`Hi, I need help with BizTrack. Business: ${businessName}. Email: ${user?.email}`)}`;
    const steps = [
      { title: "Choose your currency", text: "Pick Naira, Dollar or Kuwaiti Dinar in Settings.", page: "Settings" },
      { title: "Add your products", text: "In Inventory, add each product with its stock and price. Fewer than 10 units shows as Low stock.", page: "Inventory" },
      { title: "Record sales and expenses", text: "Tap New transaction. For a product sale, pick the product and quantity and your stock goes down by itself.", page: "Transactions" },
      { title: "Write down who owes you", text: "In Debts, add what a customer owes and record each payment when it arrives.", page: "Debts" },
      { title: "Check your profit", text: "Overview shows your revenue, expenses and net profit.", page: "Overview" },
    ];
    const faqs = [
      { q: "I made a mistake. How do I fix it?", a: "In Transactions or Inventory, tap the pencil to edit or the bin to delete. Deleting a product sale puts the units back in stock." },
      { q: "How do I record a sale and reduce my stock?", a: "Tap New transaction, keep the type as Income, choose the product and the quantity. The amount fills in from the product price and the stock goes down." },
      { q: "A customer bought on credit. What do I do?", a: "Open Debts, tap Add debt, and enter the customer, amount and due date. When they pay, tap Record payment and it is added to your income." },
      { q: "Does changing the currency convert my amounts?", a: "No. It only changes the symbol. Amounts you already saved stay the same numbers." },
      { q: "Can I download my records?", a: "Yes. In Transactions, tap Export CSV to get a file you can open in Excel." },
      { q: "Is my data private?", a: "Yes. Only you can see your records." },
      { q: "What happens when my free trial ends?", a: "Your records stay safe, but you cannot add new ones until you pay. See How to pay below, then message us on WhatsApp so we can activate your account." },
      { q: "I forgot my password.", a: "Log out, then tap Forgot password on the login screen. We will email you a link to choose a new one." },
    ];
    return (
      <>
        <section className="panel help-panel">
          <h2>Get started in 5 steps</h2>
          <ol className="help-steps">
            {steps.map((step) => (
              <li key={step.title}>
                <div><strong>{step.title}</strong><p>{step.text}</p></div>
                <button className="text-button" onClick={() => changePage(step.page)}>Open {step.page} <ArrowUpRight size={14} /></button>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel help-panel">
          <h2>Common questions</h2>
          <div className="help-faq">
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="panel help-panel">
          <h2>How to pay</h2>
          <p>Pay in your own currency, then message us on WhatsApp and we will activate your account.</p>
          <PaymentInfo />
        </section>
        <section className="panel help-panel help-contact">
          <div>
            <h2>Still need help?</h2>
            <p>Chat with us on WhatsApp ({OWNER_CONTACT.replace("WhatsApp ", "")}). Send us a message and we will get back to you.</p>
          </div>
          <a className="primary-button" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
        </section>
      </>
    );
  }

  function renderSettings() {
    return (
      <section className="panel settings-panel">
        <div className="settings-icon"><Settings size={25} /></div>
        <h2>Workspace settings</h2>
        <p>Your records are saved securely online and only you can see them.</p>
        <div className="settings-item"><span>Business</span><strong>{businessName}</strong></div>
        <div className="settings-item"><span>Email</span><strong>{user?.email}</strong></div>
        <div className="settings-item"><span>Plan</span><strong>{planLabel}</strong></div>
        <div className="settings-item">
          <span>Currency</span>
          <select className="settings-select" value={currency} onChange={(event) => changeCurrency(event.target.value)} aria-label="Currency">
            {Object.values(CURRENCIES).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </div>
        <p className="demo-note">Changing currency only changes the symbol. Amounts you already saved are not converted.</p>
        <div className="settings-item"><span>Version</span><strong>2.0.0</strong></div>
        <button className="secondary-button" onClick={onSignOut}><LogOut size={16} /> Log out</button>
      </section>
    );
  }

  const historyReady = useRef(false);
  useEffect(() => {
    if (!historyReady.current) {
      historyReady.current = true;
      window.history.replaceState({ bizPage: activePage }, "");
      return;
    }
    if (window.history.state?.bizPage !== activePage) {
      window.history.pushState({ bizPage: activePage }, "");
    }
  }, [activePage]);

  useEffect(() => {
    function handlePop(event) {
      const page = event.state?.bizPage;
      if (!page) return;
      setActivePage(page);
      setSearch("");
      setMenuOpen(false);
      window.scrollTo(0, 0);
    }
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  if (loading) return <div className="auth-center">Loading your workspace...</div>;
  if (loadError) return <div className="auth-center">We could not load your data: {loadError}</div>;

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" />}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ChartNoAxesCombined size={23} strokeWidth={2.6} /></div>
          <span>biz<span className="brand-light">track</span><small>BUSINESS MANAGER</small></span>
          <button className="mobile-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Close sidebar"><X size={19} /></button>
        </div>

        <div className="workspace-switch">
          <div className="workspace-avatar">{initials[0] || "B"}</div>
          <div className="workspace-copy"><strong>{businessName}</strong><span>{planLabel}</span></div>
          <ChevronDown size={16} />
        </div>

        <p className="nav-label">WORKSPACE</p>
        <nav className="main-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? "active" : ""}`} onClick={() => changePage(label)}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
              {label === "Inventory" && products.some((product) => product.stock < 10) && <span className="nav-count">{products.filter((product) => product.stock < 10).length}</span>}
            </button>
          ))}
        </nav>

        <p className="nav-label tools-label">PREFERENCES</p>
        <nav className="main-nav">
          <button className={`nav-item ${activePage === "Settings" ? "active" : ""}`} onClick={() => changePage("Settings")}><Settings size={19} strokeWidth={1.8} /><span>Settings</span></button>
        </nav>

        {isOwner && onViewLanding && (
          <button className="sidebar-link" onClick={onViewLanding}><Globe size={18} /> View landing page</button>
        )}

        <div className="sidebar-spacer" />
        <div className="upgrade-card">
          <div className="upgrade-symbol"><TrendingUp size={19} /></div>
          <strong>Grow your business</strong>
          <p>Stay on top of every transaction and opportunity.</p>
          <button onClick={() => changePage("Analytics")}>Explore analytics <ArrowUpRight size={15} /></button>
        </div>
        <button className="help-link" onClick={() => changePage("Help")}><CircleHelp size={18} /> Help & support <ArrowUpRight size={14} /></button>
        <div className="profile-row">
          <div className="profile-avatar">{initials || "B"}</div>
          <div className="profile-copy"><strong>{businessName}</strong><span>{user?.email}</span></div>
          <button className="icon-button" onClick={onSignOut} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            {activePage !== "Overview" && (
              <button className="back-button" onClick={() => window.history.back()} aria-label="Go back">
                <ArrowLeft size={17} /> <span>Back</span>
              </button>
            )}
            <div className="breadcrumb">Workspace <span>/</span> <strong>{activePage}</strong></div>
          </div>
          <div className="topbar-right">
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activePage.toLowerCase()}...`} aria-label="Search current page" />
              <kbd>⌘ K</kbd>
            </label>
            <ThemeToggle />
            <button className="notification-button icon-button" onClick={() => notify("You're all caught up!")} aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="topbar-divider" />
            <div className="topbar-user"><div className="profile-avatar">{initials || "B"}</div><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="live-dot" /> YOUR BUSINESS AT A GLANCE</div>
              <h1>{activePage === "Overview" ? `Good day, ${businessName}` : activePage}</h1>
              <p>{pageDescriptions[activePage] || "Manage your business with confidence."}</p>
            </div>
            <div className="heading-actions">
              {activePage === "Clients" || activePage === "Help" ? null : activePage === "Inventory" ? (
                <button className="primary-button" onClick={() => setShowProductForm(true)}><Plus size={17} /> Add product</button>
              ) : activePage === "Debts" ? (
                <button className="primary-button" onClick={() => setShowDebtForm(true)}><Plus size={17} /> Add debt</button>
              ) : (
                <button className="primary-button" onClick={() => setShowTransactionForm(true)}><Plus size={17} /> New transaction</button>
              )}
            </div>
          </div>

          {activePage === "Overview" && renderOverview()}
          {activePage === "Transactions" && renderTransactions()}
          {activePage === "Inventory" && renderInventory()}
          {activePage === "Customers" && renderCustomers()}
          {activePage === "Debts" && renderDebts()}
          {activePage === "Analytics" && renderAnalytics()}
          {activePage === "Clients" && isOwner && <OwnerClients currentUserId={user.id} />}
          {activePage === "Help" && renderHelp()}
          {activePage === "Settings" && renderSettings()}

          <footer className="app-footer"><span>© 2026 BizTrack. Built for better business.</span><span><i className="footer-status" /> All systems operational</span></footer>
        </div>
      </main>

      {showTransactionForm && (
        <Modal title="Add transaction" subtitle="Record a sale, other income or an expense." onClose={() => setShowTransactionForm(false)}>
          <form className="modal-form" onSubmit={addTransaction}>
            <div className="form-row">
              <label>Type<select value={newTransaction.type} onChange={(event) => changeNewTransaction({ type: event.target.value })}><option>Income</option><option>Expense</option></select></label>
              <label>Date<input type="date" value={newTransaction.date} max={todayStr} onChange={(event) => setNewTransaction({ ...newTransaction, date: event.target.value })} required /></label>
            </div>
            {newTransaction.type === "Income" && products.length > 0 && (
              <div className="form-row">
                <label>Product sold (optional)
                  <select value={newTransaction.productId} onChange={(event) => changeNewTransaction({ productId: event.target.value })}>
                    <option value="">Not a product sale</option>
                    {products.map((item) => <option key={item.id} value={item.id} disabled={item.stock < 1}>{item.name} ({item.stock} in stock)</option>)}
                  </select>
                </label>
                {newTransaction.productId && (
                  <label>Quantity sold<input type="number" min="1" step="1" value={newTransaction.quantity} onChange={(event) => changeNewTransaction({ quantity: event.target.value })} required /></label>
                )}
              </div>
            )}
            <label>Description<input autoFocus value={newTransaction.name} onChange={(event) => setNewTransaction({ ...newTransaction, name: event.target.value, nameAuto: false })} placeholder="e.g. Phone case x2" required /></label>
            <label>Customer or vendor<input value={newTransaction.customer} onChange={(event) => setNewTransaction({ ...newTransaction, customer: event.target.value })} placeholder="e.g. Ahmed" /></label>
            <div className="form-row">
              <label>Amount ({currency})<input type="number" min="0.01" step="0.01" value={newTransaction.amount} onChange={(event) => setNewTransaction({ ...newTransaction, amount: event.target.value })} placeholder="0.00" required /></label>
              <label>Category<select value={newTransaction.category} onChange={(event) => setNewTransaction({ ...newTransaction, category: event.target.value })}>{TRANSACTION_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowTransactionForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16} /> Save transaction</button></div>
          </form>
        </Modal>
      )}

      {editingTransaction && transactionForm && (
        <Modal
          title="Edit transaction"
          subtitle={editingTransaction.productId ? "To change the product or quantity, delete this sale and record it again." : "Fix a mistake in this record."}
          onClose={() => setEditingTransaction(null)}
        >
          <form className="modal-form" onSubmit={saveTransactionEdit}>
            <label>Description<input autoFocus value={transactionForm.name} onChange={(event) => setTransactionForm({ ...transactionForm, name: event.target.value })} required /></label>
            <label>Customer or vendor<input value={transactionForm.customer} onChange={(event) => setTransactionForm({ ...transactionForm, customer: event.target.value })} /></label>
            <div className="form-row">
              <label>Amount ({currency})<input type="number" min="0.01" step="0.01" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} required /></label>
              <label>Type<select value={transactionForm.type} disabled={Boolean(editingTransaction.productId)} onChange={(event) => setTransactionForm({ ...transactionForm, type: event.target.value })}><option>Income</option><option>Expense</option></select></label>
            </div>
            <div className="form-row">
              <label>Date<input type="date" value={transactionForm.date} max={todayStr} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} required /></label>
              <label>Category<select value={transactionForm.category} onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })}>{withCurrent(TRANSACTION_CATEGORIES, transactionForm.category).map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingTransaction(null)}>Cancel</button><button className="primary-button" type="submit"><Check size={16} /> Save changes</button></div>
          </form>
        </Modal>
      )}

      {editingProduct && productForm && (
        <Modal title="Edit product" subtitle="Update the details or correct the stock count." onClose={() => setEditingProduct(null)}>
          <form className="modal-form" onSubmit={saveProductEdit}>
            <label>Product name<input autoFocus value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
            <label>Category<select value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}>{withCurrent(PRODUCT_CATEGORIES, productForm.category).map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="form-row">
              <label>Stock quantity<input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required /></label>
              <label>Unit price ({currency})<input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required /></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingProduct(null)}>Cancel</button><button className="primary-button" type="submit"><Check size={16} /> Save changes</button></div>
          </form>
        </Modal>
      )}

      {showProductForm && (
        <Modal title="Add product" subtitle="Add an item to your inventory catalog." onClose={() => setShowProductForm(false)}>
          <form className="modal-form" onSubmit={addProduct}>
            <label>Product name<input autoFocus value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} placeholder="e.g. Wireless Mouse" required /></label>
            <label>Category<select value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })}>{PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="form-row">
              <label>Stock quantity<input type="number" min="0" step="1" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })} placeholder="0" required /></label>
              <label>Unit price ({currency})<input type="number" min="0" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} placeholder="0.00" required /></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowProductForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16} /> Save product</button></div>
          </form>
        </Modal>
      )}

      {showDebtForm && (
        <Modal title="Add customer debt" subtitle="Record goods or services given on credit." onClose={() => setShowDebtForm(false)}>
          <form className="modal-form" onSubmit={addDebt}>
            <label>Customer name<input autoFocus value={newDebt.customer} onChange={(event) => setNewDebt({ ...newDebt, customer: event.target.value })} placeholder="e.g. Ahmed Salem" required /></label>
            <label>What was it for?<input value={newDebt.note} onChange={(event) => setNewDebt({ ...newDebt, note: event.target.value })} placeholder="e.g. Phone cases" /></label>
            <div className="form-row">
              <label>Amount owed ({currency})<input type="number" min="0.01" step="0.01" value={newDebt.amount} onChange={(event) => setNewDebt({ ...newDebt, amount: event.target.value })} placeholder="0.00" required /></label>
              <label>Due date<input type="date" value={newDebt.dueDate} onChange={(event) => setNewDebt({ ...newDebt, dueDate: event.target.value })} /></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowDebtForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16} /> Save debt</button></div>
          </form>
        </Modal>
      )}

      {paymentDebt && (
        <Modal title="Record payment" subtitle={`${paymentDebt.customer} still owes ${money(paymentDebt.amount - paymentDebt.paid)}.`} onClose={() => setPaymentDebt(null)}>
          <form className="modal-form" onSubmit={recordPayment}>
            <label>Amount received ({currency})<input autoFocus type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required /></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setPaymentDebt(null)}>Cancel</button><button className="primary-button" type="submit"><Check size={16} /> Save payment</button></div>
          </form>
        </Modal>
      )}

      {notice && <div className="toast"><span className="toast-check"><Check size={15} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </div>
  );
}

function MetricCard({ title, amount, change, caption, icon: Icon, color, down = false }) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span className="metric-title">{title}</span><span className={`metric-icon ${color}`}><Icon size={20} strokeWidth={1.9} /></span></div>
      <div className="metric-amount">{amount}</div>
      <div className="metric-bottom"><span className={`metric-change ${down ? "negative-change" : ""}`}>{down ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{change}</span><span className="metric-caption">{caption}</span></div>
    </article>
  );
}

function TransactionTable({ items, onViewAll, money, onEdit, onDelete }) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading table-heading">
        <div><h2>Recent transactions</h2><p>A quick look at your latest activity</p></div>
        {onViewAll && <button className="text-button" onClick={onViewAll}>View all <ArrowUpRight size={15} /></button>}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Transaction</th><th>Transaction ID</th><th>Date</th><th>Amount</th><th>Status</th>{onEdit && <th>Actions</th>}</tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><div className="transaction-name"><span className={`transaction-icon ${item.type === "Income" ? "income-icon" : "expense-icon"}`}>{item.type === "Income" ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div><strong>{item.name}</strong><small>{item.customer}{item.quantity ? ` · ${item.quantity} sold` : ""}</small></div></div></td>
                <td className="muted-cell">{item.ref}</td>
                <td className="muted-cell">{item.date}</td>
                <td className={`amount-cell ${item.amount < 0 ? "expense-amount" : ""}`}>{item.amount < 0 ? "−" : "+"}{money(Math.abs(item.amount))}</td>
                <td><span className={`status-pill ${item.status === "Completed" ? "status-completed" : "status-pending"}`}><i />{item.status}</span></td>
                {onEdit && (
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`} title="Edit"><Pencil size={16} /></button>
                      <button className="icon-button" onClick={() => onDelete(item)} aria-label={`Delete ${item.name}`} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && <EmptyRow message="No transactions found. Try another search or add a transaction." />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyRow({ message }) {
  return <tr><td colSpan={8} className="empty-row">{message}</td></tr>;
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
        {children}
      </section>
    </div>
  );
}

export default App;
