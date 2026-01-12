import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui/Card";

const COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#fb7185", "#fbbf24", "#22d3ee", "#c084fc"];

function EmptyState({ label }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      {label}
    </div>
  );
}

export default function AnalyticsDashboard({ data, loading }) {
  const series = data?.series || [];

  const campaignsByStatus = (data?.breakdowns?.campaignsByStatus || []).map((d) => ({
    name: d.status,
    value: d.count,
  }));

  const logsByStatus = (data?.breakdowns?.logsByStatus || []).map((d) => ({
    name: d.status,
    value: d.count,
  }));

  const campaignsByType = (data?.breakdowns?.campaignsByType || []).map((d) => ({
    name: d.type,
    value: d.count,
  }));

  const usersByCity = (data?.breakdowns?.usersByCity || []).map((d) => ({
    name: d.city,
    value: d.count,
  }));

  const hasSeries = series.length > 0;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Card title="Notifications sent (month-wise)">
        {loading ? (
          <EmptyState label="Loading chart…" />
        ) : !hasSeries ? (
          <EmptyState label="No data" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="notificationsSent" name="Notifications" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Campaigns created (month-wise)">
        {loading ? (
          <EmptyState label="Loading chart…" />
        ) : !hasSeries ? (
          <EmptyState label="No data" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="campaignsCreated" name="Campaigns" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Campaign status breakdown">
        {loading ? (
          <EmptyState label="Loading chart…" />
        ) : campaignsByStatus.length === 0 ? (
          <EmptyState label="No data" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={campaignsByStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {campaignsByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Notification log status">
        {loading ? (
          <EmptyState label="Loading chart…" />
        ) : logsByStatus.length === 0 ? (
          <EmptyState label="No data" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={logsByStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {logsByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Campaigns by notification type">
        {loading ? (
          <EmptyState label="Loading chart…" />
        ) : campaignsByType.length === 0 ? (
          <EmptyState label="No data" />
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignsByType} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Campaigns" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {usersByCity.length ? (
        <Card title="Top user cities">
          {loading ? (
            <EmptyState label="Loading chart…" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByCity} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Users" fill="#fb7185" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
