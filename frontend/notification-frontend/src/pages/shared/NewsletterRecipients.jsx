import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { getArticleRecipients } from "../../services/newsletterService";
import { getErrorMessage } from "../../services/http";
import { formatDateTime, safeUpper } from "../../utils/format";

function getBackToNewslettersPath(pathname) {
  const parts = String(pathname || "")
    .split("/")
    .filter(Boolean);
  const base = parts[0];
  if (!base) return "/";
  return `/${base}/newsletters`;
}

export default function NewsletterRecipients() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const backPath = useMemo(() => getBackToNewslettersPath(location.pathname), [location.pathname]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [article, setArticle] = useState(null);
  const [mode, setMode] = useState("draft");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

  const [filters, setFilters] = useState({
    q: "",
    city: "",
    role: "all",
    status: "all",
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
      const data = await getArticleRecipients(articleId, {
        page: pageToUse,
        limit: limitToUse,
        q: filtersToUse.q,
        city: filtersToUse.city,
        role: filtersToUse.role,
        status: filtersToUse.status,
      });

      setArticle(data?.article || null);
      setMode(data?.mode || "draft");
      setRows(data?.items || []);

      setMeta(
        data?.meta || {
          page: pageToUse,
          limit: limitToUse,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        }
      );

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
  }, [articleId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      void fetchPage({ nextPage: 1, nextFilters: filters });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.city, filters.role, filters.status]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (rows?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, rows]);

  const tableRows = useMemo(() => {
    return (rows || []).map((r, idx) => ({
      ...r,
      id:
        r?.id ??
        `${r?.user?.user_id ?? idx}-${r?.channel ?? (r?.channels || []).join("-")}-${r?.status || ""}-${r?.sent_at || ""}`,
    }));
  }, [rows]);

  const statusOptions = useMemo(() => {
    if (mode !== "sent") return ["pending"];
    const set = new Set((rows || []).map((r) => r.status).filter(Boolean));
    return Array.from(set);
  }, [rows, mode]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        title: "Name",
        render: (r) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{r?.user?.name || "—"}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{r?.user?.email || ""}</div>
          </div>
        ),
      },
      {
        key: "city",
        title: "City",
        render: (r) => <span>{r?.user?.city || "—"}</span>,
      },
      {
        key: "role",
        title: "Role",
        render: (r) => <span className="text-xs font-semibold">{safeUpper(r?.user?.role || "") || "—"}</span>,
      },
      {
        key: "channel",
        title: "Channel",
        render: (r) => {
          const channels = r?.channel ? [r.channel] : Array.isArray(r?.channels) ? r.channels : [];
          if (channels.length === 0) return <span>—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {channels.map((c) => (
                <Badge
                  key={c}
                  color={c === "push" ? "blue" : c === "email" ? "yellow" : "slate"}
                >
                  {c}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        key: "status",
        title: "Status",
        render: (r) => (
          <Badge color={r?.status === "success" ? "green" : r?.status === "pending" ? "yellow" : "red"}>
            {r?.status || "—"}
          </Badge>
        ),
      },
      {
        key: "sent_at",
        title: "Sent At",
        render: (r) => <span className="text-slate-700 dark:text-slate-200">{r?.sent_at ? formatDateTime(r.sent_at) : "—"}</span>,
      },
    ],
    []
  );

  const title = article?.title
    ? `Recipients • ${article?.newsletter?.title ? `${article.newsletter.title} / ` : ""}${article.title}`
    : "Article Recipients";

  const subtitle =
    mode === "sent"
      ? "Users who received this article (with delivery status)."
      : "Users who will receive this article when published (preview for draft).";

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />

      {error ? <Alert type="error">{error}</Alert> : null}

      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => navigate(backPath)} className="!p-2" aria-label="Back to Newsletters" title="Back to Newsletters">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {article ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={article.status === "sent" ? "green" : "yellow"}>{article.status === "sent" ? "published" : "draft"}</Badge>
            <Badge color="blue">newsletter article</Badge>
          </div>
        ) : null}
      </div>

      <Card title={`Users (${loading ? "..." : meta.total})`}>
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search name/email..."
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
          />

          <Input
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
          />

          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.role}
            onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="creator">Creator</option>
            <option value="viewer">Viewer</option>
            <option value="user">User</option>
          </select>

          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            value={filters.status}
            disabled={mode !== "sent"}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
            title={mode !== "sent" ? "Status filter is only available for sent newsletters" : undefined}
          >
            <option value="all">All status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Table columns={columns} rows={tableRows} keyField="id" />

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

            <Button variant="secondary" disabled={!meta?.hasPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>

            <div className="min-w-[110px] text-center text-sm text-slate-700 dark:text-slate-200">
              Page <span className="font-semibold">{meta?.page || 1}</span> / {meta?.totalPages || 1}
            </div>

            <Button variant="secondary" disabled={!meta?.hasNext || loading} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
