import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import AnalyticsDashboard from "../../components/charts/AnalyticsDashboard";
import { getOverviewAnalytics } from "../../services/analyticsService";
import { getErrorMessage } from "../../services/http";
import Alert from "../../components/ui/Alert";

export default function CreatorDashboard() {
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

  const stats = useMemo(() => {
    const campaignsByStatus = analytics?.breakdowns?.campaignsByStatus || [];
    const drafts = campaignsByStatus.find((s) => s.status === "draft")?.count || 0;
    const sent = campaignsByStatus.find((s) => s.status === "sent")?.count || 0;
    return { drafts, sent };
  }, [analytics]);

  const totals = analytics?.totals || {};

  return (
    <div>
      <PageHeader title="Creator Dashboard" subtitle="Create campaigns, manage users, and review logs." />
      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Campaigns" value={loading ? "..." : totals.totalCampaigns ?? 0} />
        <StatCard label="Draft" value={loading ? "..." : stats.drafts} />
        <StatCard label="Logs" value={loading ? "..." : totals.totalLogs ?? 0} />
      </div>

      <div className="mt-4">
        <StatCard label="Sent" value={loading ? "..." : stats.sent} hint="Campaigns marked as sent" />
      </div>

      <AnalyticsDashboard data={analytics} loading={loading} />
    </div>
  );
}
