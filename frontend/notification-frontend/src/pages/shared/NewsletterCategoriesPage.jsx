import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import { Card, CardGrid } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import { FormField } from "../../components/ui/FormField";

import {
  createCategory,
  listCategoriesPaged,
  updateCategory,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "../../services/newsletterService";
import { getErrorMessage } from "../../services/http";

export default function NewsletterCategoriesPage({ basePath, readOnly = false, enableSubscriptions = false }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [filters, setFilters] = useState({ q: "", creator: "" });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", short_description: "", cover_image_url: "" });

  async function toggleSubscribe(e, category) {
    e.preventDefault();
    e.stopPropagation();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const nextSubscribed = !category?.isSubscribed;
      if (nextSubscribed) {
        await subscribeToNewsletter(category.newsletter_id);
        setSuccess("Subscribed");
      } else {
        await unsubscribeFromNewsletter(category.newsletter_id);
        setSuccess("Unsubscribed");
      }

      setItems((prev) =>
        prev.map((c) =>
          c.newsletter_id === category.newsletter_id
            ? { ...c, isSubscribed: nextSubscribed, subscribed_at: nextSubscribed ? new Date().toISOString() : null }
            : c
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const fetchPage = useCallback(
    async ({ nextPage, nextFilters } = {}) => {
      const pageToUse = nextPage ?? page;
      const filtersToUse = nextFilters ?? filters;

      setLoading(true);
      setError("");
      try {
        const data = await listCategoriesPaged({
          page: pageToUse,
          limit,
          q: filtersToUse.q,
          creator: filtersToUse.creator,
        });

        setItems(data?.items || []);
        setMeta(data?.meta || { page: pageToUse, limit, total: 0, totalPages: 1, hasPrev: false, hasNext: false });

        if (data?.meta?.page && data.meta.page !== pageToUse) setPage(data.meta.page);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [filters, limit, page]
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
  }, [filters.q, filters.creator]);

  useEffect(() => {
    void fetchPage({ nextPage: page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (items?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, items]);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", short_description: "", cover_image_url: "" });
  }

  function openEdit(category) {
    setEditing(category);
    setForm({
      title: category?.title || "",
      short_description: category?.short_description || "",
      cover_image_url: category?.cover_image_url || "",
    });
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!form.title.trim()) {
        setError("Title is required");
        return;
      }
      if (!form.short_description.trim()) {
        setError("Short description is required");
        return;
      }

      if (editing) {
        await updateCategory(editing.newsletter_id, {
          title: form.title,
          short_description: form.short_description,
          cover_image_url: form.cover_image_url,
        });
        setSuccess("Category updated");
      } else {
        await createCategory({
          title: form.title,
          short_description: form.short_description,
          cover_image_url: form.cover_image_url,
        });
        setSuccess("Category created");
      }

      setEditing(null);
      setForm({ title: "", short_description: "", cover_image_url: "" });
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
        title="Newsletters"
        subtitle="Newsletter categories (cards). Open a category to manage and publish articles."
      />

      {error ? <Alert type="error" className="mb-4">{error}</Alert> : null}
      {success ? <Alert type="success" className="mb-4">{success}</Alert> : null}

      <div className={readOnly ? "grid gap-4" : "grid gap-4 lg:grid-cols-[1fr_360px]"}>
        <Card title={`All Categories (${loading ? "..." : meta.total})`}>
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Search</div>
              <Input
                placeholder="Search title/description..."
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">Creator</div>
              <Input
                placeholder="Filter creator name/email..."
                value={filters.creator}
                onChange={(e) => setFilters((p) => ({ ...p, creator: e.target.value }))}
              />
            </div>
          </div>

          <CardGrid>
            {items.map((c) => (
              <div
                key={c.newsletter_id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              >
                <button
                  className="block w-full text-left"
                  onClick={() => navigate(`${basePath}/newsletters/${c.newsletter_id}`)}
                  title="Open category"
                >
                  <div className="h-36 w-full bg-slate-100 dark:bg-slate-900">
                    {c.cover_image_url ? (
                      <img src={c.cover_image_url} alt={c.title} className="h-36 w-full object-cover" />
                    ) : (
                      <div className="flex h-36 items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-600">
                        {(c.title || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-50">
                      {c.title}
                    </div>
                    <div className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {c.short_description}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{c?._count?.articles ?? 0} articles</span>
                      <span>{c?.creator?.name ? `by ${c.creator.name}` : ""}</span>
                    </div>
                  </div>
                </button>

                {!readOnly || enableSubscriptions ? (
                  <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex justify-end gap-2">
                      {enableSubscriptions ? (
                        <Button
                          variant={c.isSubscribed ? "secondary" : "primary"}
                          type="button"
                          disabled={saving}
                          onClick={(e) => toggleSubscribe(e, c)}
                        >
                          {c.isSubscribed ? "Unsubscribe" : "Subscribe"}
                        </Button>
                      ) : null}

                      {!readOnly ? (
                        <>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => openEdit(c)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            onClick={() => navigate(`${basePath}/newsletters/${c.newsletter_id}`)}
                          >
                            Open
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </CardGrid>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">{rangeLabel}</div>
            <div className="flex items-center gap-2">
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

        {!readOnly ? (
          <Card
            title={editing ? "Edit Category" : "Create Category"}
            right={
              <Button variant="secondary" type="button" onClick={openCreate}>
                New
              </Button>
            }
          >
            <form className="grid gap-3" onSubmit={onSave}>
              <FormField label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Category title"
                />
              </FormField>

              <FormField label="Short description">
                <textarea
                  className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  value={form.short_description}
                  onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                  placeholder="Short description for the card"
                />
              </FormField>

              <FormField label="Cover image URL (optional)">
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Save" : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
