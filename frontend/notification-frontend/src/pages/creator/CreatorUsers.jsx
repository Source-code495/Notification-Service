import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { FormField } from "../../components/ui/FormField";
import UserDetailsModal from "../../components/UserDetailsModal";
import {
  createUser,
  deleteUser,
  getCreatorUserOptions,
  listCreatorUsersPaged,
  uploadUsersCsv,
  getMe
} from "../../services/userService";
import { getErrorMessage } from "../../services/http";
// import { use } from "react";

export default function CreatorUsers() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1, hasPrev: false, hasNext: false });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [me,setMe] = useState(null);
  const [options, setOptions] = useState({ roles: ["admin", "creator", "viewer", "user"], cities: [] });

  const [filters, setFilters] = useState({
    q: "",
    role: "all",
    city: "all",
    status: "all",
    preference: "any",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    city: "",
  });

  async function loadOptions() {
    try {
      const data = await getCreatorUserOptions();
      setOptions({
        roles: data?.roles?.length ? data.roles : ["admin", "creator", "viewer", "user"],
        cities: data?.cities || [],
      });
    } catch {
      // keep defaults
    }
  }

  async function fetchPage({ nextPage, nextLimit, nextFilters } = {}) {
    const pageToUse = nextPage ?? page;
    const limitToUse = nextLimit ?? limit;
    const filtersToUse = nextFilters ?? filters;

    setLoading(true);
    setError("");
    try {
      const data = await listCreatorUsersPaged({
        page: pageToUse,
        limit: limitToUse,
        q: filtersToUse.q,
        role: filtersToUse.role,
        city: filtersToUse.city,
        status: filtersToUse.status,
        preference: filtersToUse.preference,
      });
      const me = await getMe();
      setMe(me); 
      console.log(me)
      setUsers(data?.items || []);
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
    void loadOptions();
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
  }, [filters.q, filters.role, filters.city, filters.status, filters.preference]);

  useEffect(() => {
    void fetchPage({ nextPage: page, nextLimit: limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const roleOptions = useMemo(() => options.roles || ["admin", "creator", "viewer", "user"], [options.roles]);
  const cityOptions = useMemo(() => options.cities || [], [options.cities]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        title: "User",
        render: (u) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-slate-50">{u.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
          </div>
        ),
      },
      {
        key: "role",
        title: "Role",
        render: (u) => <Badge color={u.role === "creator" ? "yellow" : u.role === "viewer" ? "slate" : "green"}>{u.role}</Badge>,
      },
      {
        key: "city",
        title: "City",
        render: (u) => u.city || "—",
      },
      {
        key: "preference",
        title: "Preferences",
        render: (u) => (
          <div className="flex flex-wrap gap-1">
            <Badge color={u.preference?.offers ? "green" : "slate"}>offers</Badge>
            <Badge color={u.preference?.order_updates ? "green" : "slate"}>order_updates</Badge>
            <Badge color={u.preference?.newsletter ? "green" : "slate"}>newsletter</Badge>
          </div>
        ),
      },
      {
        key: "status",
        title: "Status",
        render: (u) => <Badge color={u.is_active ? "green" : "red"}>{u.is_active ? "active" : "inactive"}</Badge>,
      },
    ],
    []
  );

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        city: newUser.city || null,
      });
      setSuccess("User created");
      setNewUser({ name: "", email: "", password: "", role: "viewer", city: "" });
      setPage(1);
      await fetchPage({ nextPage: 1 });
      await loadOptions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onUploadCsv(file) {
    if (!file) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await uploadUsersCsv(file);
      setSuccess(res?.message || "CSV uploaded");
      setPage(1);
      await fetchPage({ nextPage: 1 });
      await loadOptions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const rangeLabel = useMemo(() => {
    const total = meta?.total || 0;
    if (!total) return "Showing 0 of 0";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(total, (meta.page - 1) * meta.limit + (users?.length || 0));
    return `Showing ${start}-${end} of ${total}`;
  }, [meta, users]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Creator can create viewer/user accounts and upload CSV."
        right={
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">Upload CSV</span>
            <input type="file" accept=".csv" disabled={saving} onChange={(e) => onUploadCsv(e.target.files?.[0])} />
          </label>
        }
      />

      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? <div className="mt-2"><Alert type="success">{success}</Alert></div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Create User">
          <form className="space-y-3" onSubmit={onCreate}>
            <FormField label="Name">
              <Input value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} required />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required />
            </FormField>
            <FormField label="Password">
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} required />
            </FormField>
            <FormField label="Role">
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="viewer">viewer</option>
                <option value="user">user</option>
              </select>
            </FormField>
            <FormField label="City (optional)">
              <Input value={newUser.city} onChange={(e) => setNewUser((p) => ({ ...p, city: e.target.value }))} />
            </FormField>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Saving..." : "Create"}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card
            title={`All Users (${loading ? "..." : meta.total})`}
          >
            <div className="mb-3 grid gap-2 md:grid-cols-5">
              <Input
                placeholder="Search name/email..."
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              />

              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.role}
                onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="all">All roles</option>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.city}
                onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
              >
                <option value="all">All cities</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="all">All status</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>

              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={filters.preference}
                onChange={(e) => setFilters((p) => ({ ...p, preference: e.target.value }))}
              >
                <option value="any">Any preference</option>
                <option value="offers">offers enabled</option>
                <option value="order_updates">order_updates enabled</option>
                <option value="newsletter">newsletter enabled</option>
              </select>
            </div>

            <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Tip: click any row to view/edit city & preferences.
            </div>
            <Table
              columns={columns}
              rows={users}
              keyField="user_id"
              onRowClick={(u) => {
                setSelectedUser(u);
                setDetailsOpen(true);
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

      <UserDetailsModal
        open={detailsOpen}
        user={selectedUser}
        onClose={() => setDetailsOpen(false)}
        onSaved={async () => {
          await fetchPage();
          await loadOptions();
        }}
         allowDelete={ selectedUser?.role !== me?.role}
        onDelete={async (u) => {
          try {
            setError("");
            setSuccess("");
            await deleteUser(u.user_id);
            setSuccess("User deleted");
            setDetailsOpen(false);
            setSelectedUser(null);
            if ((users?.length || 0) <= 1 && (meta?.page || 1) > 1) {
              setPage((p) => Math.max(1, p - 1));
            } else {
              await fetchPage();
            }
            await loadOptions();
          } catch (err) {
            setError(getErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
