import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CampaignDetailsModal from "../../components/CampaignDetailsModal";
import { listCampaignsPaged } from "../../services/campaignService";
import { getErrorMessage } from "../../services/http";
import { formatDateTimeFull } from "../../utils/format";

export default function ViewerCampaigns() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    type: "all",
    status: "all",
    city: "",
    creator: "",
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
      const data = await listCampaignsPaged({
        page: pageToUse,
        limit: limitToUse,
        q: filtersToUse.q,
        type: filtersToUse.type,
        status: filtersToUse.status,
        city: filtersToUse.city,
        creator: filtersToUse.creator,
      });
      setCampaigns(data?.items || []);
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
  }, [filters.q, filters.type, filters.status, filters.city, filters.creator]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const columns = useMemo(
    () => [
      {
        key: "campaign_name",
        title: "Campaign",
        render: (c) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{c.campaign_name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Targets:{" "}
              {Array.isArray(c.city_filters) && c.city_filters.length > 0
                ? `${c.city_filters.length} cities`
                : "All cities"}
            </div>
          </div>
        ),
      },
      { key: "notification_type", title: "Type", render: (c) => <Badge color="blue">{c.notification_type}</Badge> },
      {
        key: "creator",
        title: "Creator",
        render: (c) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{c?.creator?.name || "-"}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{c?.creator?.email || "-"}</div>
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (c) => (
          <Badge
            color={
              c.status === "sent" ? "green" : c.status === "draft" ? "yellow" : "blue"
            }
          >
            {c.status}
          </Badge>
        ),
      },
      {
        key: "scheduled_at",
        title: "Scheduled",
        render: (c) => (
          <span className="text-xs text-slate-600 dark:text-slate-300">
            {c?.scheduled_at ? formatDateTimeFull(c.scheduled_at) : "—"}
          </span>
        ),
      },
      {
        key: "preview",
        title: "Preview",
        render: (c) => (
          <Button
            variant="secondary"
            className="px-2 py-2"
            onClick={(e) => {
              e?.stopPropagation?.();
              navigate(`/viewer/campaigns/${c.campaign_id}/recipients`);
            }}
            title="Preview recipients"
            aria-label="Preview recipients"
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [navigate]
  );

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (campaigns?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, campaigns]);

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Read-only campaign list." />
      {error ? <Alert type="error">{error}</Alert> : null}
      <Card title={`All Campaigns (${loading ? "..." : meta.total})`}>
        <div className="mb-3 grid gap-2 md:grid-cols-5">
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            placeholder="Search campaign..."
          />
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.type}
            onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
          >
            <option value="all">All types</option>
            <option value="offers">Offers</option>
          </select>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
          </select>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.city}
            onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            placeholder="Filter by city..."
          />
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.creator}
            onChange={(e) => setFilters((p) => ({ ...p, creator: e.target.value }))}
            placeholder="Filter by creator..."
          />
        </div>
        <Table
          columns={columns}
          rows={campaigns}
          keyField="campaign_id"
          onRowClick={(c) => setSelected(c)}
        />

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

      {selected ? (
        <CampaignDetailsModal
          open={true}
          campaign={selected}
          saving={false}
          error={""}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
