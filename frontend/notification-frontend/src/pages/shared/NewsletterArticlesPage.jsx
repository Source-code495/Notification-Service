import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";

import {
  createArticle,
  listArticlesPaged,
  publishArticle,
  updateArticle,
} from "../../services/newsletterService";
import { getErrorMessage } from "../../services/http";

export default function NewsletterArticlesPage({ basePath, readOnly = false }) {
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [filters, setFilters] = useState({ q: "", status: "all" });

  const [form, setForm] = useState({ title: "", message: "" });
  const [selected, setSelected] = useState(null);

  const fetchPage = useCallback(
    async ({ nextPage, nextLimit, nextFilters } = {}) => {
      const pageToUse = nextPage ?? page;
      const limitToUse = nextLimit ?? limit;
      const filtersToUse = nextFilters ?? filters;

      setLoading(true);
      setError("");
      try {
        const data = await listArticlesPaged(categoryId, {
          page: pageToUse,
          limit: limitToUse,
          q: filtersToUse.q,
          status: filtersToUse.status,
        });

        setCategory(data?.category || null);
        setItems(data?.items || []);
        setMeta(data?.meta || { page: pageToUse, limit: limitToUse, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

        if (data?.meta?.page && data.meta.page !== pageToUse) setPage(data.meta.page);
        if (data?.meta?.limit && data.meta.limit !== limitToUse) setLimit(data.meta.limit);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [categoryId, filters, limit, page]
  );

  useEffect(() => {
    void fetchPage({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      void fetchPage({ nextPage: 1, nextFilters: filters });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.status]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (items?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, items]);

  const columns = useMemo(
    () => [
      {
        key: "title",
        title: "Article",
        render: (a) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{a.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{a.message}</div>
          </div>
        ),
      },
      {
        key: "creator",
        title: "Creator",
        render: (a) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{a?.creator?.name || "—"}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{a?.creator?.email || ""}</div>
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (a) => <Badge color={a.status === "sent" ? "green" : "yellow"}>{a.status}</Badge>,
      },
      {
        key: "actions",
        title: "Actions",
        render: (a) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="px-2"
              title="Preview recipients"
              aria-label="Preview recipients"
              onClick={(e) => {
                e?.stopPropagation?.();
                navigate(`${basePath}/newsletters/articles/${a.article_id}/recipients`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {!readOnly ? (
              <Button
                disabled={saving || a.status === "sent"}
                onClick={async (e) => {
                  e?.stopPropagation?.();
                  setSaving(true);
                  setError("");
                  setSuccess("");
                  try {
                    const res = await publishArticle(a.article_id);
                    setSuccess(`${res?.message || "Article published"} (recipients: ${res?.recipients ?? "?"})`);
                    await fetchPage();
                  } catch (err) {
                    setError(getErrorMessage(err));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {a.status === "sent" ? "Published" : "Publish"}
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [basePath, fetchPage, navigate, readOnly, saving]
  );

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createArticle({
        newsletter_id: categoryId,
        title: form.title,
        message: form.message,
      });
      setSuccess("Article created");
      setForm({ title: "", message: "" });
      await fetchPage({ nextPage: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onUpdateSelected(e) {
    e.preventDefault();
    if (!selected) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateArticle(selected.article_id, {
        title: selected.title,
        message: selected.message,
      });
      setSuccess("Article updated");
      setSelected(null);
      await fetchPage();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={category?.title ? `Articles • ${category.title}` : "Newsletter Articles"}
        subtitle="Create draft articles, preview recipients, and publish to newsletter-enabled users."
      />

      {error ? <Alert type="error" className="mb-4">{error}</Alert> : null}
      {success ? <Alert type="success" className="mb-4">{success}</Alert> : null}

      <div className={readOnly ? "grid gap-4" : "grid gap-4 lg:grid-cols-2"}>
        {!readOnly ? (
          <Card title="Create Article">
            <form className="grid gap-3" onSubmit={onCreate}>
              <FormField label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Article title"
                />
              </FormField>

              <FormField label="Message">
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Write your article..."
                />
              </FormField>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => navigate(`${basePath}/newsletters`)}>
                  Back
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <Card title={`All Articles (${loading ? "..." : meta.total})`}>
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Search</div>
              <Input
                placeholder="Search title/message..."
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Status</div>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Published</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="secondary" type="button" onClick={() => navigate(`${basePath}/newsletters`)}>
                Back to Categories
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            rows={items}
            keyField="article_id"
            onRowClick={!readOnly ? (row) => setSelected(row) : undefined}
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

      {!readOnly && selected ? (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Edit Article">
          <form className="grid gap-3" onSubmit={onUpdateSelected}>
            {selected.status !== "draft" ? <Alert type="warning">Only draft articles can be edited.</Alert> : null}

            <FormField label="Title">
              <Input
                value={selected.title || ""}
                onChange={(e) => setSelected((p) => ({ ...p, title: e.target.value }))}
                disabled={selected.status !== "draft"}
              />
            </FormField>

            <FormField label="Message">
              <textarea
                className="min-h-[140px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selected.message || ""}
                onChange={(e) => setSelected((p) => ({ ...p, message: e.target.value }))}
                disabled={selected.status !== "draft"}
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || selected.status !== "draft"}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
