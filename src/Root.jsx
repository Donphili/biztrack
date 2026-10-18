import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { OWNER_CONTACT, OWNER_WHATSAPP_LINK } from "./config";
import AuthScreen, { ResetPassword } from "./Auth.jsx";
import Landing from "./Landing.jsx";
import PaymentInfo from "./PaymentInfo.jsx";
import App from "./App.jsx";
import "./Auth.css";

function hasAccess(profile) {
  if (!profile) return false;
  if (profile.plan === "active") return !profile.paid_until || new Date(profile.paid_until) > new Date();
  return profile.plan === "trial" && new Date(profile.trial_ends_at) > new Date();
}

export default function Root() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState("idle");
  const [recovering, setRecovering] = useState(false);
  const [authView, setAuthView] = useState(null);
  const [view, setView] = useState("app");
  const [jump, setJump] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setProfileState("error");
        } else {
          setProfile(data);
          setProfileState("ready");
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const signOut = async () => {
    setProfile(null);
    setProfileState("idle");
    setAuthView(null);
    setView("app");
    await supabase.auth.signOut();
  };

  if (session === undefined) {
    return <div className="auth-center">Loading BizTrack...</div>;
  }

  if (recovering && session) {
    return <ResetPassword onDone={() => setRecovering(false)} />;
  }

  if (userId && profileState === "idle") {
    return <div className="auth-center">Loading BizTrack...</div>;
  }

  if (!session) {
    if (!authView) {
      return <Landing onLogin={() => setAuthView("login")} onSignup={() => setAuthView("signup")} />;
    }
    return <AuthScreen key={authView} initialMode={authView} onBack={() => setAuthView(null)} />;
  }
  if (profile && profile.id !== userId) return <div className="auth-center">Loading BizTrack...</div>;

  if (profileState === "error") {
    return (
      <div className="auth-center">
        <div className="auth-card">
          <h1>Something went wrong</h1>
          <p className="auth-sub">We could not load your account. Please refresh the page or log in again.</p>
          <button className="secondary-button" onClick={signOut}>Log out</button>
        </div>
      </div>
    );
  }

  if (profileState === "ready" && !hasAccess(profile)) {
    const wasPaid = profile.plan === "active";
    return (
      <div className="auth-center">
        <div className="auth-card">
          <h1>{wasPaid ? "Your subscription has ended" : "Your free trial has ended"}</h1>
          <p className="auth-sub">
            Your records are safe. To keep adding sales, stock and debts, pay for your plan using one of the options below,
            then message us on WhatsApp and we will activate your account.
          </p>
          <PaymentInfo />
          <p className="auth-sub">
            <a href={OWNER_WHATSAPP_LINK} target="_blank" rel="noreferrer">Message us on WhatsApp ({OWNER_CONTACT.replace("WhatsApp ", "")})</a>
          </p>
          <button className="secondary-button" onClick={signOut}>Log out</button>
        </div>
      </div>
    );
  }

  if (profileState !== "ready") return <div className="auth-center">Loading BizTrack...</div>;

  const isOwner = session.user.app_metadata?.is_owner === true;

  return (
    <>
      <div style={{ display: view === "app" ? "contents" : "none" }}>
        <App
          user={session.user}
          profile={profile}
          isOwner={isOwner}
          onSignOut={signOut}
          onViewLanding={() => { window.scrollTo(0, 0); setView("landing"); }}
          requestedPage={jump}
        />
      </div>
      {isOwner && view === "landing" && (
        <Landing
          ownerMode
          onSignup={() => setView("app")}
          onLogin={() => setView("app")}
          onDashboard={() => setView("app")}
          onAdmin={() => { setJump({ page: "Clients", id: Date.now() }); setView("app"); }}
        />
      )}
    </>
  );
}
