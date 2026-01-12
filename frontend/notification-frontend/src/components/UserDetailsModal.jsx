import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Badge from "./ui/Badge";
import { FormField } from "./ui/FormField";
import { updateUser } from "../services/userService";
import { updatePreferences } from "../services/preferenceService";
import { getErrorMessage } from "../services/http";

function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-50">{label}</div>
        {hint ? <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
      </div>
      <input type="checkbox" className="mt-1 h-5 w-5" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function UserDetailsModal({ open, user, onClose, onSaved, allowDelete, onDelete }) {
  const [city, setCity] = useState("");
  const [offers, setOffers] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setCity(user.city || "");
    setOffers(!!user.preference?.offers);
    setOrderUpdates(!!user.preference?.order_updates);
    setNewsletter(!!user.preference?.newsletter);
    setError("");
    setSuccess("");
  }, [user]);

  async function onSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await Promise.all([
        updateUser(user.user_id, { city }),
        updatePreferences(user.user_id, {
          offers,
          order_updates: orderUpdates,
          newsletter,
        }),
      ]);
      setSuccess("User updated");
      await onSaved?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={user ? `User Details — ${user.email}` : "User Details"}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">Click Save after making changes.</div>
          <div className="flex gap-2">
            {allowDelete ? (
              <Button
                variant="danger"
                disabled={saving}
                onClick={async () => {
                  if (!user) return;
                  if (!confirm(`Delete ${user.email}?`)) return;
                  await onDelete?.(user);
                }}
              >
                Delete
              </Button>
            ) : null}
            <Button disabled={saving} onClick={onSave}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      }
    >
      {!user ? <div className="text-sm text-slate-500 dark:text-slate-400">No user selected</div> : null}

      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? (
        <div className="mt-2">
          <Alert type="success">{success}</Alert>
        </div>
      ) : null}

      {user ? (
        <div className="mt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Basic</div>
              <div className="mt-2 space-y-1 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Name:</span> {user.name}
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Email:</span> {user.email}
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Phone:</span> {user.phone || "—"}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Badge color={user.role === "admin" ? "blue" : user.role === "creator" ? "yellow" : user.role === "viewer" ? "slate" : "green"}>
                  {user.role}
                </Badge>
                <Badge color={user.is_active ? "green" : "red"}>{user.is_active ? "active" : "inactive"}</Badge>
              </div>
              <div className="mt-3">
                <FormField label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lahore" />
                </FormField>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Preferences</div>
            <div className="space-y-3">
              <ToggleRow label="Offers" hint="Promotions and discounts" checked={offers} onChange={setOffers} />
              <ToggleRow label="Order Updates" hint="Delivery and order status updates" checked={orderUpdates} onChange={setOrderUpdates} />
              <ToggleRow label="Newsletter" hint="Monthly updates and announcements" checked={newsletter} onChange={setNewsletter} />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
