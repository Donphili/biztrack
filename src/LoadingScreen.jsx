import { useEffect, useState } from "react";

// Shows a loading message, and a friendly explanation if it takes too long.
export default function LoadingScreen({ label = "Loading BizTrack..." }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="auth-center">
      <div>
        <p className="loading-label">{label}</p>
        {slow && (
          <div className="loading-slow">
            <p>This is taking longer than usual. The server may be waking up, which can take a minute.</p>
            <button className="secondary-button" onClick={() => window.location.reload()}>Try again</button>
          </div>
        )}
      </div>
    </div>
  );
}
