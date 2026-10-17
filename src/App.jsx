
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import OwnerClients from "./Owner.jsx";
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

const today = () => new Date().toISOString().slice(0, 10);

function debtStatus(debt) {
  const outstanding = debt.amount - debt.paid;
  if (outstanding <= 0) return "Paid";
  if (debt.dueDate && debt.dueDate < today()) return "Overdue";
  return debt.paid > 0 ? "Partial" : "Unpaid";
}

const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

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

const axisMoney = (value) => (Math.abs(value) >= 1000 ? `$${value / 1000}k` : `$${value}`);

function App({ user, profile, isOwner, onSignOut }) {
  const [activePage, setActivePage] = useState("Overview");
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
  const [newTransaction, setNewTransaction] = useState({
    name: "",
    customer: "",
    amount: "",
    type: "Income",
    category: "Services",
  });
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
  const planLabel = profile?.plan === "active" ? "Active plan" : `Free trial · ${daysLeft} days left`;

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

  async function addTransaction(event) {
    event.preventDefault();
    const value = Number(newTransaction.amount);

    if (!newTransaction.name.trim() || !newTransaction.amount || value <= 0) {
      notify("Enter a transaction name and a valid amount.");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ref: `TXN-${Date.now().toString().slice(-6)}`,
        name: newTransaction.name.trim(),
        customer: newTransaction.customer.trim() || "Unspecified",
        amount: newTransaction.type === "Expense" ? -value : value,
        type: newTransaction.type,
        status: "Completed",
        category: newTransaction.category,
      })
      .select()
      .single();

    if (error) {
      notify(error.message);
      return;
    }

    setTransactions((current) => [fromTransactionRow(data), ...current]);
    setNewTransaction({ name: "", customer: "", amount: "", type: "Income", category: "Services" });
    setShowTransactionForm(false);
    notify("Transaction added successfully.");
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
                  <CartesianGrid stroke="#eef0f6" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 11 }} tickFormatter={axisMoney} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={{ border: "1px solid #eceef5", borderRadius: 12, boxShadow: "0 8px 24px #20223b12" }} />
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
                  <CartesianGrid stroke="#eef0f6" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 10 }} tickFormatter={axisMoney} />
                  <Tooltip formatter={(value) => money(value)} />
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

        <TransactionTable
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
        <TransactionTable items={filteredTransactions} />
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
                <CartesianGrid stroke="#eef0f6" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 11 }} tickFormatter={axisMoney} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="income" name="Revenue" fill="#7667f8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f4a261" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
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
        <div className="settings-item"><span>Currency</span><strong>USD ($)</strong></div>
        <div className="settings-item"><span>Version</span><strong>2.0.0</strong></div>
        <button className="secondary-button" onClick={onSignOut}><LogOut size={16} /> Log out</button>
      </section>
    );
  }

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

        <div className="sidebar-spacer" />
        <div className="upgrade-card">
          <div className="upgrade-symbol"><TrendingUp size={19} /></div>
          <strong>Grow your business</strong>
          <p>Stay on top of every transaction and opportunity.</p>
          <button onClick={() => changePage("Analytics")}>Explore analytics <ArrowUpRight size={15} /></button>
        </div>
        <button className="help-link" onClick={() => notify("Help center will be available in a future version.")}><CircleHelp size={18} /> Help & support <ArrowUpRight size={14} /></button>
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
            <div className="breadcrumb">Workspace <span>/</span> <strong>{activePage}</strong></div>
          </div>
          <div className="topbar-right">
            <label className="search-box">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activePage.toLowerCase()}...`} aria-label="Search current page" />
              <kbd>⌘ K</kbd>
            </label>
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
              {activePage === "Clients" ? null : activePage === "Inventory" ? (
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
          {activePage === "Settings" && renderSettings()}

          <footer className="app-footer"><span>© 2026 BizTrack. Built for better business.</span><span><i className="footer-status" /> All systems operational</span></footer>
        </div>
      </main>

      {showTransactionForm && (
        <Modal title="Add transaction" subtitle="Record new income or business expenses." onClose={() => setShowTransactionForm(false)}>
          <form className="modal-form" onSubmit={addTransaction}>
            <label>Transaction description<input autoFocus value={newTransaction.name} onChange={(event) => setNewTransaction({ ...newTransaction, name: event.target.value })} placeholder="e.g. Website design project" required /></label>
            <label>Customer or vendor<input value={newTransaction.customer} onChange={(event) => setNewTransaction({ ...newTransaction, customer: event.target.value })} placeholder="e.g. Acme Company" /></label>
            <div className="form-row">
              <label>Amount (USD)<input type="number" min="0.01" step="0.01" value={newTransaction.amount} onChange={(event) => setNewTransaction({ ...newTransaction, amount: event.target.value })} placeholder="0.00" required /></label>
              <label>Type<select value={newTransaction.type} onChange={(event) => setNewTransaction({ ...newTransaction, type: event.target.value })}><option>Income</option><option>Expense</option></select></label>
            </div>
            <label>Category<select value={newTransaction.category} onChange={(event) => setNewTransaction({ ...newTransaction, category: event.target.value })}><option>Services</option><option>Products</option><option>Operations</option><option>Marketing</option><option>Software</option><option>Subscriptions</option><option>Other</option></select></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowTransactionForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16} /> Save transaction</button></div>
          </form>
        </Modal>
      )}

      {showProductForm && (
        <Modal title="Add product" subtitle="Add an item to your inventory catalog." onClose={() => setShowProductForm(false)}>
          <form className="modal-form" onSubmit={addProduct}>
            <label>Product name<input autoFocus value={newProduct.name} onChange={(event) => setNewProduct({ ...newProduct, name: event.target.value })} placeholder="e.g. Wireless Mouse" required /></label>
            <label>Category<select value={newProduct.category} onChange={(event) => setNewProduct({ ...newProduct, category: event.target.value })}><option>Electronics</option><option>Office</option><option>Stationery</option><option>Accessories</option><option>Other</option></select></label>
            <div className="form-row">
              <label>Stock quantity<input type="number" min="0" step="1" value={newProduct.stock} onChange={(event) => setNewProduct({ ...newProduct, stock: event.target.value })} placeholder="0" required /></label>
              <label>Unit price (USD)<input type="number" min="0" step="0.01" value={newProduct.price} onChange={(event) => setNewProduct({ ...newProduct, price: event.target.value })} placeholder="0.00" required /></label>
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
              <label>Amount owed (USD)<input type="number" min="0.01" step="0.01" value={newDebt.amount} onChange={(event) => setNewDebt({ ...newDebt, amount: event.target.value })} placeholder="0.00" required /></label>
              <label>Due date<input type="date" value={newDebt.dueDate} onChange={(event) => setNewDebt({ ...newDebt, dueDate: event.target.value })} /></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowDebtForm(false)}>Cancel</button><button className="primary-button" type="submit"><Plus size={16} /> Save debt</button></div>
          </form>
        </Modal>
      )}

      {paymentDebt && (
        <Modal title="Record payment" subtitle={`${paymentDebt.customer} still owes ${money(paymentDebt.amount - paymentDebt.paid)}.`} onClose={() => setPaymentDebt(null)}>
          <form className="modal-form" onSubmit={recordPayment}>
            <label>Amount received (USD)<input autoFocus type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required /></label>
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

function TransactionTable({ items, onViewAll }) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading table-heading">
        <div><h2>Recent transactions</h2><p>A quick look at your latest activity</p></div>
        {onViewAll && <button className="text-button" onClick={onViewAll}>View all <ArrowUpRight size={15} /></button>}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Transaction</th><th>Transaction ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><div className="transaction-name"><span className={`transaction-icon ${item.type === "Income" ? "income-icon" : "expense-icon"}`}>{item.type === "Income" ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span><div><strong>{item.name}</strong><small>{item.customer}</small></div></div></td>
                <td className="muted-cell">{item.ref}</td>
                <td className="muted-cell">{item.date}</td>
                <td className={`amount-cell ${item.amount < 0 ? "expense-amount" : ""}`}>{item.amount < 0 ? "−" : "+"}{money(Math.abs(item.amount))}</td>
                <td><span className={`status-pill ${item.status === "Completed" ? "status-completed" : "status-pending"}`}><i />{item.status}</span></td>
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
