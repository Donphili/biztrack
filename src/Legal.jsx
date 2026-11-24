import { useEffect } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import { OWNER_CONTACT, OWNER_WHATSAPP_LINK } from "./config";
import "./Legal.css";

const UPDATED = "November 23, 2026";
const OPERATOR = "BizTrack, run by Don Philip in Kuwait";

const privacy = {
  title: "Privacy Policy",
  intro: `${OPERATOR} ("we", "us"), runs the BizTrack website and app. This page explains what information we keep, why, and the choices you have.`,
  sections: [
    {
      h: "What we collect",
      list: [
        "Your account details: your email, business name, chosen currency, and your password (stored in scrambled form by our login provider, so we cannot read it).",
        "Your business records: the products, stock changes, sales, expenses, customer names, debts and payments that you type in.",
        "Plan and payment records: when your trial or plan ends, and records of the payments you send us (date, amount, currency, method and a note).",
        "Basic technical data: your browser keeps a login session and your display choices (such as dark mode) on your own device. Our hosting and database providers keep standard server logs, such as time and IP address.",
      ],
    },
    {
      h: "How we use it",
      p: "We use your information only to run BizTrack: to show your records back to you, to manage your plan, to keep the service secure, and to help you when you contact us. We do not sell your information, we do not show ads, and we do not use your records for anything else.",
    },
    {
      h: "Who can see your records",
      p: "Your business records are private to your account. We can see account details (your email, business name and plan dates) and the payments you made to us so that we can manage plans. We do not look at your sales, stock or debts unless you ask for help, or it is needed to fix a problem or keep the service safe.",
    },
    {
      h: "Companies that help us run BizTrack",
      list: [
        "Supabase provides our database and login. Your data is stored on servers in Mumbai, India.",
        "Vercel hosts the website.",
        "WhatsApp is used when you message us for support or to activate your plan.",
        "Payments you send through Wamd, Opay or another method are handled by those services, not by BizTrack.",
      ],
    },
    {
      h: "Information about your customers",
      p: "If you enter names or details of your own customers (for example in debts), you are responsible for having the right to keep that information. We only store it for you.",
    },
    {
      h: "How long we keep it",
      p: "We keep your records while your account exists, including after a trial or plan ends, so you can come back. You can delete your account at any time in Settings. When you do, we delete your account and all your records, including your stock history. We keep a record of payments you made to us (date, amount, method, your email and business name) for our accounts.",
    },
    {
      h: "Your choices",
      list: [
        "See and correct your records at any time in the app.",
        "Download a copy of your data in Settings, under Download my data.",
        "Delete your account and records in Settings, under Delete my account.",
        "Message us with any question about your information.",
      ],
    },
    {
      h: "Security",
      p: "We use encrypted connections (HTTPS), and each account's records are protected so that other clients cannot see them. No online service is perfectly secure, so please use a strong password and keep it private.",
    },
    {
      h: "Who BizTrack is for",
      p: "BizTrack is a business tool for adults. It is not meant for children.",
    },
    {
      h: "Changes to this page",
      p: "We may update this policy. The date at the top shows when it was last changed.",
    },
  ],
};

const terms = {
  title: "Terms of Use",
  intro: `These terms are between you and ${OPERATOR} ("we", "us"). By creating an account or using BizTrack, you agree to them.`,
  sections: [
    { h: "What BizTrack is", p: "BizTrack is a simple record-keeping tool for small businesses. It helps you note sales, expenses, stock and customer debts and see totals." },
    { h: "Your account", p: "You must be an adult and give accurate information. Keep your password private. You are responsible for what happens under your account." },
    {
      h: "Free trial and plans",
      list: [
        "New accounts get a 14-day free trial with no card needed.",
        "After the trial, you need an active plan to add or change records. You can still view your records and download your data.",
        "Prices are shown on our website and in the app. We may change prices for future periods.",
        "You pay in advance for the period you choose. After you pay and message us on WhatsApp, we activate your account.",
        "Payments go through Wamd, Opay or another method we agree. We are not responsible for their fees or delays. If you think a payment was a mistake, message us and we will look into it.",
      ],
    },
    { h: "Your data", p: "Your records belong to you. You give us permission to store and process them only to run BizTrack for you. You must have the right to enter any information about your customers." },
    { h: "Using BizTrack properly", p: "Do not use BizTrack for anything unlawful, try to reach another account, or harm or overload the service." },
    { h: "Not financial advice", p: "BizTrack helps you keep records and see totals, but it does not replace an accountant. You are responsible for checking your figures and for any taxes or filings your business owes." },
    { h: "Keep your own copies", p: "We work to keep your records safe, but you should download your data from time to time (Settings, Download my data)." },
    { h: "Availability and changes", p: "We work to keep BizTrack running, but we cannot promise it will always be available or error-free. We may improve, change or remove features." },
    { h: "Ending your use", p: "You can stop at any time and delete your account in Settings. We may suspend or close an account that breaks these terms." },
    { h: "Limits of our responsibility", p: "BizTrack is provided as it is. To the extent the law allows, we are not responsible for indirect losses such as lost profits or lost data, and our total responsibility for any claim is limited to the amount you paid us in the 3 months before the problem." },
    { h: "Changes to these terms", p: "We may update these terms. The date at the top shows when they were last changed. If you keep using BizTrack after a change, you accept the new terms." },
  ],
};

export default function Legal({ page }) {
  const doc = page === "terms" ? terms : privacy;
  useEffect(() => {
    document.title = `${doc.title} | BizTrack`;
  }, [doc.title]);
  const other = page === "terms" ? { href: "/privacy", label: "Privacy Policy" } : { href: "/terms", label: "Terms of Use" };

  return (
    <div className="legal">
      <header className="legal-nav">
        <a className="legal-brand" href="/">
          <span className="legal-mark"><ChartNoAxesCombined size={19} strokeWidth={2.6} /></span>
          <span>biz<span>track</span></span>
        </a>
        <div className="legal-nav-actions">
          <ThemeToggle className="legal-icon-btn" />
          <a className="legal-back" href="/">Back to BizTrack</a>
        </div>
      </header>

      <main className="legal-body">
        <h1>{doc.title}</h1>
        <p className="legal-updated">Last updated: {UPDATED}</p>
        <p className="legal-intro">{doc.intro}</p>

        {doc.sections.map((section) => (
          <section key={section.h}>
            <h2>{section.h}</h2>
            {section.p && <p>{section.p}</p>}
            {section.list && <ul>{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>
        ))}

        <section>
          <h2>Contact us</h2>
          <p>
            Questions about this page? Message us on{" "}
            <a href={OWNER_WHATSAPP_LINK} target="_blank" rel="noreferrer">{OWNER_CONTACT}</a>.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <span>© 2026 BizTrack</span>
        <a href={other.href}>{other.label}</a>
      </footer>
    </div>
  );
}
