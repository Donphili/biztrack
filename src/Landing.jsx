import {
  ArrowRight,
  Check,
  ChartNoAxesCombined,
  HandCoins,
  Lock,
  MessageCircle,
  Package,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { OWNER_WHATSAPP_LINK, PRICE_LABEL, PRICE_PERIOD } from "./config";
import "./Landing.css";

const whatsappHref = `${OWNER_WHATSAPP_LINK}?text=${encodeURIComponent("Hi, I have a question about BizTrack.")}`;

const features = [
  { icon: Wallet, title: "Sales and expenses", text: "Record every sale and expense in seconds and see your profit at a glance." },
  { icon: Package, title: "Stock control", text: "Keep track of your products and get a warning when stock runs low." },
  { icon: HandCoins, title: "Customer debts", text: "Write down who owes you, record each payment, and see who is overdue." },
  { icon: Users, title: "Customer list", text: "See the customers linked to your sales in one place." },
  { icon: ChartNoAxesCombined, title: "Clear reports", text: "Charts show how your income and expenses change month by month." },
  { icon: Smartphone, title: "Phone or computer", text: "Open it in your browser on any phone, tablet or computer. Nothing to install." },
];

const audiences = ["Retail shops", "Phone accessory sellers", "Salons", "Bakeries", "Small distributors"];

const steps = [
  { title: "Create your account", text: "Sign up with your email. It takes about a minute." },
  { title: "Add your products and sales", text: "Enter what you sell and record each sale or expense as it happens." },
  { title: "See your profit and debts", text: "Your dashboard shows what you earned and who still owes you." },
];

const faqs = [
  { q: "Do I need a card to start?", a: "No. Your 14-day free trial starts as soon as you sign up, with no payment details." },
  { q: "What happens after the trial?", a: "You can still see all your records, but you cannot add new ones until you activate your plan. Message us on WhatsApp and we will activate it for you." },
  { q: "Is my business data private?", a: "Yes. Each account can only see its own records." },
  { q: "Can I use it on my phone?", a: "Yes. BizTrack works in the browser on phones, tablets and computers." },
];

export default function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-mark"><ChartNoAxesCombined size={20} strokeWidth={2.6} /></span>
          <span>biz<span>track</span></span>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-link" onClick={onLogin}>Log in</button>
          <button className="landing-button" onClick={onSignup}>Start free trial</button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">For small shops and businesses</p>
          <h1>Run your shop without the notebook.</h1>
          <p className="landing-lead">
            BizTrack helps you track sales, expenses, stock and customer debts in one simple
            dashboard, so you always know your daily profit and who owes you money.
          </p>
          <div className="landing-cta">
            <button className="landing-button large" onClick={onSignup}>
              Start free trial <ArrowRight size={18} />
            </button>
            <a className="landing-button ghost large" href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>
          <p className="landing-note">14 days free. No card needed.</p>
        </div>

        <div className="landing-preview" aria-hidden="true">
          <span className="landing-preview-tag">Sample view</span>
          <div className="preview-row">
            <div className="preview-card"><small>Today&apos;s profit</small><strong>$128.50</strong></div>
            <div className="preview-card"><small>Owed to you</small><strong>$340.00</strong></div>
          </div>
          <div className="preview-chart">
            {[38, 52, 44, 66, 58, 80, 72].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="preview-list">
            <div><span>Phone case x3</span><b>+$18.00</b></div>
            <div><span>Shop rent</span><b className="neg">-$90.00</b></div>
            <div><span>Ahmed paid on debt</span><b>+$40.00</b></div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2>Everything a small shop needs</h2>
        <p className="landing-sub">Simple tools for the things you do every day.</p>
        <div className="landing-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <div className="landing-feature" key={title}>
              <span className="landing-icon"><Icon size={22} /></span>
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
        <div className="landing-price">
          <p className="landing-price-amount">{PRICE_LABEL}<span> {PRICE_PERIOD}</span></p>
          <ul>
            <li><Check size={17} /> 14-day free trial, no card needed</li>
            <li><Check size={17} /> Sales, expenses, stock, customers and debts</li>
            <li><Check size={17} /> Works on phone, tablet and computer</li>
            <li><Check size={17} /> Your records stay private to your account</li>
          </ul>
          <button className="landing-button large" onClick={onSignup}>Start free trial</button>
          <p className="landing-note">After your trial, message us on WhatsApp to activate your plan.</p>
        </div>
      </section>

      <section className="landing-section">
        <h2>Questions</h2>
        <div className="landing-faq">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <Lock size={22} />
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
          <button className="landing-link" onClick={onLogin}>Log in</button>
        </span>
      </footer>
    </div>
  );
}
