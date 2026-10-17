import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

const DAY = 86400000;

function statusOf(client, now) {
  if (client.plan === "active") return "Active";
  if (client.plan === "trial" && new Date(client.trial_ends_at).getTime() > now) return "Trial";
  return "Expired";
}

function shortDate(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function OwnerClients({ currentUserId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: failure }) => {
        if (cancelled) return;
        if (failure) setError(failure.message);
        else setClients(data);
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

  const counts = useMemo(() => {
    const result = { Active: 0, Trial: 0, Expired: 0 };
    clients.forEach((client) => { result[statusOf(client, now)] += 1; });
    return result;
  }, [clients, now]);

  const rows = clients.filter((client) =>
    `${client.business_name || ""} ${client.email || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <p className="demo-note">Loading clients...</p>;

  return (
    <section className="panel table-panel full-table-panel">
      <div className="panel-heading table-heading">
        <div>
          <h2>Clients</h2>
          <p>{clients.length} accounts · {counts.Active} active · {counts.Trial} on trial · {counts.Expired} expired</p>
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
            <tr><th>Business</th><th>Email</th><th>Joined</th><th>Status</th><th>Trial ends</th><th>Actions</th></tr>
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
                  <td className="muted-cell">{client.plan === "active" ? "-" : shortDate(client.trial_ends_at)}</td>
                  <td>
                    <div className="table-actions">
                      {status !== "Active" && (
                        <button className="text-button" disabled={busyId === client.id} onClick={() => update(client, { plan: "active" })}>Activate</button>
                      )}
                      {status !== "Active" && (
                        <button className="text-button" disabled={busyId === client.id} onClick={() => update(client, { plan: "trial", trial_ends_at: new Date(Date.now() + 14 * DAY).toISOString() })}>
                          Extend trial 14 days
                        </button>
                      )}
                      {status === "Active" && !self && (
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
  );
}
