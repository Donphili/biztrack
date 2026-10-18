import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import { CURRENCIES, formatMoney } from "./currency";
import { PRICES } from "./config";

const DAY = 86400000;
const METHODS = ["Wamd", "Opay", "Bank transfer", "Cash", "Other"];

function statusOf(client, now) {
  if (client.plan === "active") {
    if (!client.paid_until) return "Active";
    const end = new Date(client.paid_until).getTime();
    if (end <= now) return "Expired";
    return end - now < 7 * DAY ? "Due soon" : "Active";
  }
  if (client.plan === "trial" && new Date(client.trial_ends_at).getTime() > now) return "Trial";
  return "Expired";
}

function untilOf(client) {
  if (client.plan === "active") return client.paid_until ? shortDate(client.paid_until) : "No end date";
  return shortDate(client.trial_ends_at);
}

function shortDate(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function defaultAmount(currency, months) {
  const unit = Number(String(PRICES[currency]?.amount || "0").replace(/,/g, ""));
  return String(Math.round(unit * months * 100) / 100);
}

export default function OwnerClients({ currentUserId }) {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());
  const [paying, setPaying] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("paid_at", { ascending: false }),
    ]).then(([clientResult, paymentResult]) => {
      if (cancelled) return;
      const failure = clientResult.error || paymentResult.error;
      if (failure) setError(failure.message);
      else {
        setClients(clientResult.data);
        setPayments(paymentResult.data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function update(client, patch) {
    setBusyId(client.id);
    setError("");
    const { data, error: failure } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", client.id)
      .select()
      .single();
    setBusyId("");
    if (failure) {
      setError(failure.message);
      return;
    }
    setClients((current) => current.map((item) => (item.id === data.id ? data : item)));
  }

  function openPayment(client) {
    const currency = client.currency || "USD";
    setPaying({ client, months: 1, currency, method: currency === "NGN" ? "Opay" : currency === "KWD" ? "Wamd" : "Other", amount: defaultAmount(currency, 1), note: "" });
  }

  function changePaying(patch) {
    setPaying((current) => {
      const next = { ...current, ...patch };
      if ("months" in patch || "currency" in patch) next.amount = defaultAmount(next.currency, Number(next.months));
      return next;
    });
  }

  async function savePayment(event) {
    event.preventDefault();
    const amount = Number(paying.amount);
    if (!(amount >= 0) || paying.amount === "") {
      setError("Enter the amount received.");
      return;
    }
    setSaving(true);
    setError("");
    const { client } = paying;
    const currentEnd = client.plan === "active" && client.paid_until ? new Date(client.paid_until).getTime() : 0;
    const end = new Date(Math.max(Date.now(), currentEnd));
    end.setMonth(end.getMonth() + Number(paying.months));

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({ profile_id: client.id, amount, currency: paying.currency, method: paying.method, months: Number(paying.months), note: paying.note.trim() })
      .select()
      .single();
    if (paymentError) {
      setSaving(false);
      setError(paymentError.message);
      return;
    }
    setPayments((current) => [payment, ...current]);

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ plan: "active", paid_until: end.toISOString() })
      .eq("id", client.id)
      .select()
      .single();
    setSaving(false);
    if (updateError) {
      setError("Payment was recorded but the account was not activated: " + updateError.message);
      return;
    }
    setClients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setPaying(null);
  }

  const counts = useMemo(() => {
    const result = { Active: 0, "Due soon": 0, Trial: 0, Expired: 0 };
    clients.forEach((client) => { result[statusOf(client, now)] += 1; });
    return result;
  }, [clients, now]);

  const collected = useMemo(() => {
    const start = new Date(now);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const totals = {};
    payments.forEach((item) => {
      if (new Date(item.paid_at) >= start) totals[item.currency] = (totals[item.currency] || 0) + Number(item.amount);
    });
    return Object.entries(totals).map(([code, total]) => formatMoney(total, code));
  }, [payments, now]);

  const rows = clients.filter((client) =>
    `${client.business_name || ""} ${client.email || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <p className="demo-note">Loading clients...</p>;

  return (
    <>
      <section className="panel table-panel full-table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h2>Clients</h2>
            <p>
              {clients.length} accounts · {counts.Active} active · {counts["Due soon"]} due soon · {counts.Trial} on trial · {counts.Expired} expired
            </p>
            <p>Collected this month: {collected.length ? collected.join(" · ") : "nothing recorded yet"}</p>
          </div>
          <input
            className="owner-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search clients"
          />
        </div>
        {error && <p className="auth-message error" style={{ margin: "0 20px 14px" }}>{error}</p>}
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Business</th><th>Email</th><th>Joined</th><th>Status</th><th>Paid until / trial ends</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((client) => {
                const status = statusOf(client, now);
                const self = client.id === currentUserId;
                return (
                  <tr key={client.id}>
                    <td><strong>{client.business_name || "-"}</strong>{self ? " (you)" : ""}</td>
                    <td className="muted-cell">{client.email}</td>
                    <td className="muted-cell">{shortDate(client.created_at)}</td>
                    <td><span className={`status-pill ${status === "Active" ? "status-completed" : "status-pending"}`}><i />{status}</span></td>
                    <td className="muted-cell">{untilOf(client)}</td>
                    <td>
                      <div className="table-actions">
                        {!self && (
                          <button className="text-button" disabled={busyId === client.id} onClick={() => openPayment(client)}>Record payment</button>
                        )}
                        {client.plan !== "active" && (
                          <button className="text-button" disabled={busyId === client.id} onClick={() => update(client, { plan: "trial", trial_ends_at: new Date(Date.now() + 14 * DAY).toISOString() })}>
                            Extend trial 14 days
                          </button>
                        )}
                        {client.plan === "active" && !self && (
                          <button className="text-button" disabled={busyId === client.id} onClick={() => { if (window.confirm(`Deactivate ${client.business_name || client.email}?`)) update(client, { plan: "expired" }); }}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan="6" className="muted-cell" style={{ padding: 24, textAlign: "center" }}>No clients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {paying && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaying(null); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="pay-title">
            <div className="modal-heading">
              <div>
                <h2 id="pay-title">Record payment</h2>
                <p>{paying.client.business_name || paying.client.email} will be activated for the months you choose.</p>
              </div>
              <button className="icon-button" onClick={() => setPaying(null)} aria-label="Close dialog"><X size={19} /></button>
            </div>
            <form className="modal-form" onSubmit={savePayment}>
              <div className="form-row">
                <label>Months paid
                  <select value={paying.months} onChange={(event) => changePaying({ months: event.target.value })}>
                    {[1, 2, 3, 6, 12].map((value) => <option key={value} value={value}>{value} {value === 1 ? "month" : "months"}</option>)}
                  </select>
                </label>
                <label>Currency
                  <select value={paying.currency} onChange={(event) => changePaying({ currency: event.target.value })}>
                    {Object.values(CURRENCIES).map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>Amount received
                  <input type="number" min="0" step="0.01" value={paying.amount} onChange={(event) => changePaying({ amount: event.target.value })} required />
                </label>
                <label>Paid through
                  <select value={paying.method} onChange={(event) => changePaying({ method: event.target.value })}>
                    {METHODS.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
              <label>Note (optional)
                <input value={paying.note} onChange={(event) => changePaying({ note: event.target.value })} placeholder="e.g. paid after WhatsApp chat" />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setPaying(null)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={saving}><Check size={16} /> {saving ? "Saving..." : "Save and activate"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
