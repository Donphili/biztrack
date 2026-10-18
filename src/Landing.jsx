import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChartNoAxesCombined,
  HandCoins,
  MessageCircle,
  Package,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { OWNER_WHATSAPP_LINK, PRICES, PRICE_PERIOD } from "./config";
import ThemeToggle from "./ThemeToggle.jsx";
import "./Landing.css";

const whatsappHref = `${OWNER_WHATSAPP_LINK}?text=${encodeURIComponent("Hi, I have a question about BizTrack.")}`;

const features = [
  { icon: Wallet, tone: "violet", title: "Sales and expenses", text: "Record every sale and expense in seconds and see your profit at a glance." },
  { icon: Package, tone: "teal", title: "Stock control", text: "Keep track of your products and get a warning when stock runs low." },
  { icon: HandCoins, tone: "amber", title: "Customer debts", text: "Write down who owes you, record each payment, and see who is overdue." },
  { icon: Users, tone: "pink", title: "Customer list", text: "See the customers linked to your sales in one place." },
  { icon: ChartNoAxesCombined, tone: "blue", title: "Clear reports", text: "Charts show how your income and expenses change month by month." },
  { icon: Smartphone, tone: "violet", title: "Phone or computer", text: "Open it in your browser on any phone, tablet or computer. Nothing to install." },
];

const audiences = ["Retail shops", "Phone accessory sellers", "Salons", "Bakeries", "Small distributors"];

const steps = [
  { title: "Create your account", text: "Sign up with your email. It takes about a minute." },
  { title: "Add your products and sales", text: "Enter what you sell and record each sale or expense as it happens." },
  { title: "See your profit and debts", text: "Your dashboard shows what you earned and who still owes you." },
];

const faqs = [
  { q: "Do I need a card to start?", a: "No. Your 14-day free trial starts as soon as you sign up, with no payment details." },
  { q: "Which currencies can I use?", a: "You can choose Nigerian Naira, US Dollar or Kuwaiti Dinar inside the app, and change it any time in Settings." },
  { q: "What happens after the trial?", a: "You can still see all your records, but you cannot add new ones until you activate your plan. Message us on WhatsApp and we will help you activate it." },
  { q: "Is my business data private?", a: "Yes. Each account can only see its own records." },
  { q: "Can I use it on my phone?", a: "Yes. BizTrack works in the browser on phones, tablets and computers." },
];

function guessCurrency() {
  try {
    const saved = window.localStorage.getItem("biztrack:pricing-currency");
    if (saved && PRICES[saved]) return saved;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (zone.includes("Lagos")) return "NGN";
    if (zone.includes("Kuwait")) return "KWD";
  } catch {
    // Fall back to dollars.
  }
  return "USD";
}

function Tile({ icon: Icon, tone, depth, className = "" }) {
  return (
    <div className={`tile-wrap ${className}`} style={{ "--d": depth }}>
      <div className={`tile tone-${tone}`}><Icon size={30} strokeWidth={2.2} /></div>
    </div>
  );
}

function Coin({ symbol, depth, className = "" }) {
  return (
    <div className={`tile-wrap ${className}`} style={{ "--d": depth }}>
      <div className="coin"><span>{symbol}</span></div>
    </div>
  );
}

export default function Landing({ ownerMode = false, onLogin, onSignup, onDashboard, onAdmin }) {
  const stageRef = useRef(null);
  const [currency, setCurrency] = useState(guessCurrency);
  const price = PRICES[currency];

  function pickCurrency(code) {
    setCurrency(code);
    try {
      window.localStorage.setItem("biztrack:pricing-currency", code);
    } catch {
      // Not remembered, that is fine.
    }
  }

  function handleMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
    const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
    stageRef.current?.style.setProperty("--mx", x.toFixed(3));
    stageRef.current?.style.setProperty("--my", y.toFixed(3));
  }

  function handleLeave() {
    stageRef.current?.style.setProperty("--mx", "0");
    stageRef.current?.style.setProperty("--my", "0");
  }

  return (
    <div className="landing">
      {ownerMode && (
        <div className="landing-owner-bar">
          You are previewing the landing page as the owner.
          <button onClick={onDashboard}>Back to dashboard</button>
          <button onClick={onAdmin}>Open admin</button>
        </div>
      )}

      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-mark"><ChartNoAxesCombined size={20} strokeWidth={2.6} /></span>
          <span>biz<span>track</span></span>
        </div>
        <nav className="landing-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="landing-nav-actions">
          <ThemeToggle className="landing-icon-btn" />
          {ownerMode ? (
            <>
              <button className="landing-link" onClick={onAdmin}>Admin</button>
              <button className="landing-button" onClick={onDashboard}>Dashboard</button>
            </>
          ) : (
            <>
              <button className="landing-link" onClick={onLogin}>Log in</button>
              <button className="landing-button" onClick={onSignup}>Start free trial</button>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero" onPointerMove={handleMove} onPointerLeave={handleLeave}>
        <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span /> For small shops and businesses</p>
          <h1>Run your shop <em>without the notebook.</em></h1>
          <p className="landing-lead">
            Track sales, expenses, stock and customer debts in one simple dashboard, so you always
            know your daily profit and who owes you money.
          </p>
          <div className="landing-cta">
            <button className="landing-button large" onClick={onSignup}>
              Start free trial <ArrowRight size={18} />
            </button>
            <a className="landing-button ghost large" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>
          <p className="landing-note">14 days free. No card needed. Naira, Dollar or Dinar.</p>
        </div>

        <div className="landing-stage" ref={stageRef} aria-hidden="true">
          <div className="landing-preview">
            <span className="landing-preview-tag">Sample view</span>
            <div className="preview-row">
              <div className="preview-card"><small>Today&apos;s profit</small><strong>$128.50</strong></div>
              <div className="preview-card"><small>Owed to you</small><strong>$340.00</strong></div>
            </div>
            <div className="preview-chart">
              {[38, 52, 44, 66, 58, 80, 72].map((height, index) => (
                <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.12}s` }} />
              ))}
            </div>
            <div className="preview-list">
              <div><span>Phone case x3</span><b>+$18.00</b></div>
              <div><span>Shop rent</span><b className="neg">-$90.00</b></div>
              <div><span>Ahmed paid on debt</span><b>+$40.00</b></div>
            </div>
          </div>
          <Tile icon={Wallet} tone="violet" depth={22} className="pos-a" />
          <Tile icon={ChartNoAxesCombined} tone="blue" depth={-28} className="pos-b" />
          <Tile icon={HandCoins} tone="amber" depth={34} className="pos-c" />
          <Tile icon={Package} tone="teal" depth={-20} className="pos-d" />
          <Coin symbol="₦" depth={-40} className="pos-e" />
          <Coin symbol="$" depth={30} className="pos-f" />
          <Coin symbol="KD" depth={-26} className="pos-g" />
        </div>
      </section>

      <section className="landing-section" id="features">
        <h2>Everything a small shop needs</h2>
        <p className="landing-sub">Simple tools for the things you do every day.</p>
        <div className="landing-grid">
          {features.map(({ icon: Icon, tone, title, text }) => (
            <div className="landing-feature" key={title}>
              <span className={`mini-tile tone-${tone}`}><Icon size={22} strokeWidth={2.2} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section alt">
        <h2>Made for shops like yours</h2>
        <div className="landing-chips">
          {audiences.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="landing-section">
        <h2>How it works</h2>
        <div className="landing-steps">
          {steps.map((step, index) => (
            <div className="landing-step" key={step.title}>
              <span className="landing-step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section alt" id="pricing">
        <h2>Simple pricing</h2>
        <p className="landing-sub">Pick your currency.</p>
        <div className="currency-tabs" role="tablist" aria-label="Currency">
          {Object.entries(PRICES).map(([code, item]) => (
            <button key={code} role="tab" aria-selected={currency === code} className={currency === code ? "on" : ""} onClick={() => pickCurrency(code)}>
              {item.tab}
            </button>
          ))}
        </div>
        <div className="landing-price">
          <p className="landing-price-amount"><sup>{price.symbol}</sup>{price.amount}<span> {PRICE_PERIOD}</span></p>
          <ul>
            <li><Check size={17} /> 14-day free trial, no card needed</li>
            <li><Check size={17} /> Sales, expenses, stock, customers and debts</li>
            <li><Check size={17} /> Use Naira, Dollar or Dinar inside the app</li>
            <li><Check size={17} /> Your records stay private to your account</li>
          </ul>
          <button className="landing-button large" onClick={onSignup}>Start free trial</button>
          <p className="landing-note">After your trial, message us on WhatsApp and we will help you activate your plan.</p>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <h2>Questions</h2>
        <div className="landing-faq">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div className="aurora" aria-hidden="true"><i /><i /><i /></div>
        <ShieldCheck size={26} />
        <h2>Ready to know where your money goes?</h2>
        <div className="landing-cta center">
          <button className="landing-button large" onClick={onSignup}>Start free trial</button>
          <a className="landing-button ghost large" href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Questions? Chat with us
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© 2026 BizTrack</span>
        <span>
          <a href={whatsappHref} target="_blank" rel="noreferrer">WhatsApp</a>
          {" · "}
          <button className="landing-link" onClick={ownerMode ? onDashboard : onLogin}>{ownerMode ? "Dashboard" : "Log in"}</button>
        </span>
      </footer>
    </div>
  );
}
