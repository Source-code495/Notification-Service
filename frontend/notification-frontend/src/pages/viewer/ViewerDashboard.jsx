import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Alert from "../../components/ui/Alert";
import AnalyticsDashboard from "../../components/charts/AnalyticsDashboard";
import { getOverviewAnalytics } from "../../services/analyticsService";
import { getErrorMessage } from "../../services/http";

export default function ViewerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const a = await getOverviewAnalytics(12);
        if (!mounted) return;
        setAnalytics(a);
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
  }, []);

  const totals = analytics?.totals || {};

  return (
    <div>
      <PageHeader title="Viewer Dashboard" subtitle="Read-only access to campaigns and logs." />
      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Campaigns" value={loading ? "..." : totals.totalCampaigns ?? 0} />
        <StatCard label="Logs" value={loading ? "..." : totals.totalLogs ?? 0} />
      </div>

      <AnalyticsDashboard data={analytics} loading={loading} />
    </div>
  );
}
