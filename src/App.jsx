
import { useEffect, useMemo, useState } from "react";
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

const initialTransactions = [
  { id: "TXN-1008", name: "Website redesign", customer: "Olivia Martin", date: "Oct 16, 2026", amount: 1250, type: "Income", status: "Completed", category: "Services" },
  { id: "TXN-1007", name: "Office supplies", customer: "Office Depot", date: "Oct 15, 2026", amount: -185, type: "Expense", status: "Completed", category: "Operations" },
  { id: "TXN-1006", name: "Monthly subscription", customer: "James Anderson", date: "Oct 14, 2026", amount: 89, type: "Income", status: "Pending", category: "Subscriptions" },
  { id: "TXN-1005", name: "Marketing campaign", customer: "Meta Ads", date: "Oct 13, 2026", amount: -320, type: "Expense", status: "Completed", category: "Marketing" },
  { id: "TXN-1004", name: "Consulting services", customer: "Sophia Williams", date: "Oct 12, 2026", amount: 2400, type: "Income", status: "Completed", category: "Services" },
  { id: "TXN-1003", name: "Software licenses", customer: "Adobe", date: "Oct 11, 2026", amount: -65, type: "Expense", status: "Pending", category: "Software" },
];

const initialProducts = [
  { id: "PRD-001", name: "Wireless Headphones", category: "Electronics", stock: 42, price: 79.99 },
  { id: "PRD-002", name: "Desk Organizer", category: "Office", stock: 8, price: 24.5 },
  { id: "PRD-003", name: "USB-C Hub", category: "Electronics", stock: 5, price: 39.99 },
  { id: "PRD-004", name: "Notebook Set", category: "Stationery", stock: 76, price: 12.0 },
  { id: "PRD-005", name: "Laptop Stand", category: "Office", stock: 3, price: 49.99 },
];

const chartData = [
  { month: "May", income: 5200, expenses: 3100 },
  { month: "Jun", income: 6800, expenses: 3900 },
  { month: "Jul", income: 6100, expenses: 3500 },
  { month: "Aug", income: 8200, expenses: 4600 },
  { month: "Sep", income: 7400, expenses: 4100 },
  { month: "Oct", income: 9500, expenses: 5200 },
];

const money = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode or full); keep working in memory.
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [transactions, setTransactions] = usePersistentState("biztrack:transactions", initialTransactions);
  const [products, setProducts] = usePersistentState("biztrack:products", initialProducts);
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
      item.id,
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
    `${item.id} ${item.name} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  function addTransaction(event) {
    event.preventDefault();
    const value = Number(newTransaction.amount);

    if (!newTransaction.name.trim() || !newTransaction.amount || value <= 0) {
      notify("Enter a transaction name and a valid amount.");
      return;
    }

    const amount = newTransaction.type === "Expense" ? -value : value;
    const item = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      name: newTransaction.name.trim(),
      customer: newTransaction.customer.trim() || "Unspecified",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      amount,
      type: newTransaction.type,
      status: "Completed",
      category: newTransaction.category,
    };

    setTransactions((current) => [item, ...current]);
    setNewTransaction({
      name: "",
      customer: "",
      amount: "",
      type: "Income",
      category: "Services",
    });
    setShowTransactionForm(false);
    notify("Transaction added successfully.");
  }

  function addProduct(event) {
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

    setProducts((current) => [
      {
        id: `PRD-${String(Date.now()).slice(-5)}`,
        name: newProduct.name.trim(),
        category: newProduct.category,
        stock: Number(newProduct.stock),
        price: Number(newProduct.price),
      },
      ...current,
    ]);

    setNewProduct({
      name: "",
      category: "Electronics",
      stock: "",
      price: "",
    });
    setShowProductForm(false);
    notify("Product added successfully.");
  }

  function exportTransactions() {
    const rows = [
      ["ID", "Description", "Customer", "Date", "Type", "Amount", "Status", "Category"],
      ...filteredTransactions.map((item) => [
        item.id,
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
    { label: "Analytics", icon: ChartNoAxesCombined },
  ];

  const pageDescriptions = {
    Overview: "Here's what's happening with your business today.",
    Transactions: "Track and manage your business income and expenses.",
    Inventory: "Keep your products and stock levels under control.",
    Customers: "Review the customers linked to your transactions.",
    Analytics: "Understand your business performance at a glance.",
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
            change="+12.8%"
            caption="Compared with last month"
            icon={Wallet}
            color="violet"
          />
          <MetricCard
            title="Total expenses"
            amount={money(totals.expenses)}
            change="+4.3%"
            caption="Compared with last month"
            icon={CreditCard}
            color="orange"
            down
          />
          <MetricCard
            title="Net profit"
            amount={money(totals.profit)}
            change="+18.2%"
            caption="Compared with last month"
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Transactions"
            amount={String(transactions.length).padStart(2, "0")}
            change="+8.5%"
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
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}k`} />
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
                <BarChart data={[
                  { name: "Services", value: 4200 },
                  { name: "Products", value: 2800 },
                  { name: "Retainers", value: 1900 },
                  { name: "Other", value: 600 },
                ]} margin={{ top: 12, right: 0, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="#eef0f6" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 10 }} tickFormatter={(value) => `$${value / 1000}k`} />
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
                  <td className="muted-cell">{product.id}</td>
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
          <div className="panel-heading"><div><h2>Monthly performance</h2><p>Sample monthly figures for your business</p></div></div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#eef0f6" strokeDasharray="4 5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9298a9", fontSize: 11 }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="income" name="Revenue" fill="#7667f8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f4a261" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="demo-note">The monthly chart uses demonstration data. The headline totals above use the transactions currently in this session.</p>
        </section>
      </>
    );
  }

  function renderSettings() {
    return (
      <section className="panel settings-panel">
        <div className="settings-icon"><Settings size={25} /></div>
        <h2>Workspace settings</h2>
        <p>This is the first version of BizTrack. Your business records currently live in browser memory and reset when the page reloads.</p>
        <div className="settings-item"><span>Application</span><strong>BizTrack MVP</strong></div>
        <div className="settings-item"><span>Currency</span><strong>USD ($)</strong></div>
        <div className="settings-item"><span>Data storage</span><strong>Temporary demo data</strong></div>
        <div className="settings-item"><span>Version</span><strong>1.0.0</strong></div>
        <p className="demo-note">Next, we'll add persistent saving, authentication, and a database before using this for real business records.</p>
      </section>
    );
  }

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
          <div className="workspace-avatar">D</div>
          <div className="workspace-copy"><strong>Demo workspace</strong><span>Free plan</span></div>
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
          <div className="profile-avatar">DP</div>
          <div className="profile-copy"><strong>Demo User</strong><span>Business owner</span></div>
          <MoreHorizontal size={19} />
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
            <div className="topbar-user"><div className="profile-avatar">DP</div><ChevronDown size={15} /></div>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="live-dot" /> YOUR BUSINESS AT A GLANCE</div>
              <h1>{activePage === "Overview" ? "Good day, Philip" : activePage}</h1>
              <p>{pageDescriptions[activePage] || "Manage your business with confidence."}</p>
            </div>
            <div className="heading-actions">
              {activePage === "Inventory" ? (
                <button className="primary-button" onClick={() => setShowProductForm(true)}><Plus size={17} /> Add product</button>
              ) : (
                <button className="primary-button" onClick={() => setShowTransactionForm(true)}><Plus size={17} /> New transaction</button>
              )}
            </div>
          </div>

          {activePage === "Overview" && renderOverview()}
          {activePage === "Transactions" && renderTransactions()}
          {activePage === "Inventory" && renderInventory()}
          {activePage === "Customers" && renderCustomers()}
          {activePage === "Analytics" && renderAnalytics()}
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
                <td className="muted-cell">{item.id}</td>
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
