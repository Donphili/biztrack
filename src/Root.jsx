import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { OWNER_CONTACT } from "./config";
import AuthScreen from "./Auth.jsx";
import App from "./App.jsx";
import "./Auth.css";

function hasAccess(profile) {
  if (!profile) return false;
  if (profile.plan === "active") return true;
  return profile.plan === "trial" && new Date(profile.trial_ends_at) > new Date();
}

export default function Root() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileState, setProfileState] = useState("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    await supabase.auth.signOut();
  };

  if (session === undefined || (userId && profileState === "idle")) {
    return <div className="auth-center">Loading BizTrack...</div>;
  }

  if (!session) return <AuthScreen />;
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
    return (
      <div className="auth-center">
        <div className="auth-card">
          <h1>Your free trial has ended</h1>
          <p className="auth-sub">
            Your records are safe. To keep using BizTrack, activate your subscription.
            {OWNER_CONTACT ? ` Contact: ${OWNER_CONTACT}` : " Please contact the BizTrack owner to renew."}
          </p>
          <button className="secondary-button" onClick={signOut}>Log out</button>
        </div>
      </div>
    );
  }

  if (profileState !== "ready") return <div className="auth-center">Loading BizTrack...</div>;

  return <App user={session.user} profile={profile} onSignOut={signOut} />;
}
