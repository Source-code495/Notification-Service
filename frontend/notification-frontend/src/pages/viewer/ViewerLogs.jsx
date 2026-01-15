import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { listLogsPaged } from "../../services/logService";
import { getErrorMessage } from "../../services/http";
import { formatDateTime } from "../../utils/format";

export default function ViewerLogs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    type: "all",
    from: "",
    to: "",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  async function fetchPage({ nextPage, nextLimit, nextFilters } = {}) {
    const pageToUse = nextPage ?? page;
    const limitToUse = nextLimit ?? limit;
    const filtersToUse = nextFilters ?? filters;

    setLoading(true);
    setError("");
    try {
      const data = await listLogsPaged({
        page: pageToUse,
        limit: limitToUse,
        q: filtersToUse.q,
        status: filtersToUse.status,
        type: filtersToUse.type,
        from: filtersToUse.from,
        to: filtersToUse.to,
      });
      setLogs(data?.items || []);
      setMeta(data?.meta || { page: pageToUse, limit: limitToUse, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
      if (data?.meta?.page && data.meta.page !== pageToUse) setPage(data.meta.page);
      if (data?.meta?.limit && data.meta.limit !== limitToUse) setLimit(data.meta.limit);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPage({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      void fetchPage({ nextPage: 1, nextFilters: filters });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.status, filters.type, filters.from, filters.to]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const statusOptions = useMemo(() => {
    const set = new Set((logs || []).map((l) => l.status).filter(Boolean));
    return Array.from(set);
  }, [logs]);

  const typeOptions = useMemo(() => {
    return ["offers", "newsletter", "order_updates"];
  }, [logs]);

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (logs?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, logs]);

  const columns = useMemo(
    () => [
      { key: "sent_at", title: "Date", render: (l) => formatDateTime(l.sent_at) },
      {
        key: "user",
        title: "User",
        render: (l) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{l.user?.name || "—"}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{l.user?.email || ""}</div>
          </div>
        ),
      },
      {
        key: "campaign",
        title: "Source",
        render: (l) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">
              {l.campaign
                ? l.campaign.campaign_name
                : l.newsletterArticle
                  ? `${l.newsletterArticle.newsletter?.title ? `${l.newsletterArticle.newsletter.title} / ` : ""}${l.newsletterArticle.title}`
                  : l.order
                    ? `Order #${l.order.id.slice(0, 8)}...`
                    : "—"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {l.campaign ? l.campaign.notification_type : l.newsletterArticle ? "newsletter" : l.order ? "order_updates" : ""}
            </div>
          </div>
        ),
      },
      {
        key: "channel",
        title: "Channel",
        render: (l) => {
          const channel = l.channel || "push";
          const color = channel === "push" ? "blue" : channel === "email" ? "yellow" : "slate";
          return <Badge color={color}>{channel}</Badge>;
        },
      },
      { key: "status", title: "Status", render: (l) => <Badge color={l.status === "success" ? "green" : "red"}>{l.status}</Badge> },
    ],
    []
  );

  return (
    <div>
      <PageHeader title="Logs" subtitle="Read-only logs view." />
      {error ? <Alert type="error">{error}</Alert> : null}
      <Card title={`All Logs (${loading ? "..." : meta.total})`}>
        <div className="mb-3 grid gap-2 md:grid-cols-5">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Search</div>
            <Input
              placeholder="Search user/source..."
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">From date</div>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">To date</div>
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Status</div>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="all">All status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Type</div>
            <select
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table columns={columns} rows={logs} keyField="id" />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">{rangeLabel}</div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <Button
              variant="secondary"
              disabled={!meta?.hasPrev || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>

            <div className="min-w-[110px] text-center text-sm text-slate-700 dark:text-slate-200">
              Page <span className="font-semibold">{meta?.page || 1}</span> / {meta?.totalPages || 1}
            </div>

            <Button
              variant="secondary"
              disabled={!meta?.hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
