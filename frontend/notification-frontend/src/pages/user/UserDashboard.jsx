import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Alert from "../../components/ui/Alert";
import { useAuth } from "../../context/AuthContext";
import { getPreferences } from "../../services/preferenceService";
import { getErrorMessage } from "../../services/http";

export default function UserDashboard() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await getPreferences(userId);
        if (!mounted) return;
        setPrefs(p);
      } catch (err) {
        if (!mounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <div>
      <PageHeader title="User Dashboard" subtitle="Manage your notification preferences." />
      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Offers" value={loading ? "..." : prefs?.offers ? "On" : "Off"} />
        <StatCard label="Order Updates" value={loading ? "..." : prefs?.order_updates ? "On" : "Off"} />
        <StatCard label="Newsletter" value={loading ? "..." : prefs?.newsletter ? "On" : "Off"} />
      </div>

      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Use the Preferences page to update your settings.
      </div>
    </div>
  );
}
