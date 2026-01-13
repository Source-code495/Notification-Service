import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { FormField } from "../../components/ui/FormField";
import {
  createCampaign,
  listCampaignsPaged,
  sendCampaign,
  updateCampaign,
} from "../../services/campaignService";
import { getErrorMessage } from "../../services/http";
import CampaignDetailsModal from "../../components/CampaignDetailsModal";
import { Eye } from "lucide-react";
import { INDIAN_CITIES } from "../../constants/cities";

const notificationTypes = [
  { value: "offers", label: "Offers" },
  { value: "order_updates", label: "Order Updates" },
  { value: "newsletter", label: "Newsletter" },
];

export default function CreatorCampaigns() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
  const [selected, setSelected] = useState(null);
  const [modalError, setModalError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    type: "all",
    status: "all",
    city: "",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [form, setForm] = useState({
    campaign_name: "",
    notification_type: "offers",
    campaign_message: "",
    image_url: "",
    city_filters: [],
  });
  const [newCity, setNewCity] = useState("");

  function addCityToForm() {
    const trimmed = newCity.trim();
    if (!trimmed) return;
    setForm((p) => {
      const exists = (p.city_filters || []).some(
        (c) => String(c).toLowerCase() === trimmed.toLowerCase()
      );
      return {
        ...p,
        city_filters: exists ? p.city_filters : [...(p.city_filters || []), trimmed],
      };
    });
    setNewCity("");
  }

  function removeCityFromForm(city) {
    setForm((p) => ({
      ...p,
      city_filters: (p.city_filters || []).filter((c) => c !== city),
    }));
  }

  const fetchPage = useCallback(
    async ({ nextPage, nextLimit, nextFilters } = {}) => {
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
        });
        setCampaigns(data?.items || []);
        setMeta(
          data?.meta || { page: pageToUse, limit: limitToUse, total: 0, totalPages: 1, hasPrev: false, hasNext: false }
        );
        if (data?.meta?.page && data.meta.page !== pageToUse) setPage(data.meta.page);
        if (data?.meta?.limit && data.meta.limit !== limitToUse) setLimit(data.meta.limit);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, limit, filters]
  );

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
  }, [filters.q, filters.type, filters.status, filters.city]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (campaigns?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, campaigns]);

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
      {
        key: "notification_type",
        title: "Type",
        render: (c) => <Badge color="blue">{c.notification_type}</Badge>,
      },
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
        render: (c) => <Badge color={c.status === "sent" ? "green" : "yellow"}>{c.status}</Badge>,
      },
      {
        key: "actions",
        title: "Actions",
        render: (c) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="px-2"
              title="Preview recipients"
              aria-label="Preview recipients"
              onClick={(e) => {
                e?.stopPropagation?.();
                navigate(`/creator/campaigns/${c.campaign_id}/recipients`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              disabled={saving || c.status === "sent"}
              onClick={async (e) => {
                e?.stopPropagation?.();
                setSaving(true);
                setError("");
                setSuccess("");
                try {
                  const res = await sendCampaign(c.campaign_id);
                  setSuccess(`${res?.message || "Campaign sent"} (recipients: ${res?.recipients ?? "?"})`);
                  await fetchPage();
                } catch (err) {
                  setError(getErrorMessage(err));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {c.status === "sent" ? "Sent" : "Send"}
            </Button>
          </div>
        ),
      },
    ],
    [saving, fetchPage, navigate]
  );

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createCampaign(form);
      setSuccess("Campaign created");
      setForm({
        campaign_name: "",
        notification_type: "offers",
        campaign_message: "",
        image_url: "",
        city_filters: [],
      });
      setNewCity("");
      setPage(1);
      await fetchPage({ nextPage: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Create campaigns with optional city filters (send to all if none) and send to eligible users."
      />
      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? <div className="mt-2"><Alert type="success">{success}</Alert></div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Create Campaign">
          <form className="space-y-3" onSubmit={onCreate}>
            <FormField label="Campaign name">
              <Input value={form.campaign_name} onChange={(e) => setForm((p) => ({ ...p, campaign_name: e.target.value }))} required />
            </FormField>

            <FormField label="Image URL (optional)">
              <Input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="https://..."
              />
            </FormField>
            <FormField label="Notification type">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={form.notification_type}
                onChange={(e) => setForm((p) => ({ ...p, notification_type: e.target.value }))}
              >
                {notificationTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label="City filters (optional)"
              hint={
                (form.city_filters || []).length === 0
                  ? "No cities selected: campaign will target all cities"
                  : "Users in ANY selected city will be targeted"
              }
            >
              <div className="flex gap-2">
                <select 
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCityToForm();
                    }
                  }}
                >
                  <option value="">Select city to add</option>
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" onClick={addCityToForm}>
                  Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.city_filters || []).length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No city filters</div>
                ) : (
                  (form.city_filters || []).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="group"
                      onClick={() => removeCityFromForm(c)}
                      title="Remove"
                    >
                      <Badge>
                        <span className="mr-1">{c}</span>
                        <span className="opacity-60 group-hover:opacity-100">×</span>
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </FormField>
            <FormField label="Message">
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                rows={4}
                value={form.campaign_message}
                onChange={(e) => setForm((p) => ({ ...p, campaign_message: e.target.value }))}
                required
              />
            </FormField>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Create"}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card title={`All Campaigns (${loading ? "..." : meta.total})`}>
            <div className="mb-3 grid gap-2 md:grid-cols-4">
              <Input
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
                {notificationTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="all">All status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </select>
              <Input
                value={filters.city}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
                placeholder="Filter by city..."
              />
            </div>
            <Table
              columns={columns}
              rows={campaigns}
              keyField="campaign_id"
              onRowClick={(c) => {
                setModalError("");
                setSelected(c);
              }}
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
        </div>
      </div>

      {selected ? (
        <CampaignDetailsModal
          open={true}
          campaign={selected}
          saving={saving}
          error={modalError}
          onClose={() => setSelected(null)}
          onSave={
            selected.status === "draft"
              ? async (c, payload) => {
                  setSaving(true);
                  setModalError("");
                  setSuccess("");
                  try {
                    const updated = await updateCampaign(c.campaign_id, payload);
                    setSelected(updated);
                    setSuccess("Campaign updated");
                    await fetchPage();
                  } catch (err) {
                    setModalError(getErrorMessage(err));
                  } finally {
                    setSaving(false);
                  }
                }
              : undefined
          }
          onSend={
            selected.status === "draft"
              ? async (c) => {
                  setSaving(true);
                  setModalError("");
                  setSuccess("");
                  try {
                    const res = await sendCampaign(c.campaign_id);
                    setSuccess(`${res?.message || "Campaign sent"} (recipients: ${res?.recipients ?? "?"})`);
                    await fetchPage();
                  } catch (err) {
                    setModalError(getErrorMessage(err));
                  } finally {
                    setSaving(false);
                  }
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
