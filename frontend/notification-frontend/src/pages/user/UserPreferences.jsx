import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { useAuth } from "../../context/AuthContext";
import { getPreferences, updatePreferences } from "../../services/preferenceService";
import { getErrorMessage } from "../../services/http";

function ToggleRow({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-50">{label}</div>
        {hint ? <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
      </div>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export default function UserPreferences() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [offers, setOffers] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const prefs = await getPreferences(userId);
        if (!mounted) return;
        setOffers(!!prefs.offers);
        setOrderUpdates(!!prefs.order_updates);
        setNewsletter(!!prefs.newsletter);
      } catch (err) {
        // If preferences don't exist yet, user can still save to create them.
        if (!mounted) return;
        const msg = getErrorMessage(err);
        if (!String(msg).toLowerCase().includes("not found")) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  async function onSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updatePreferences(userId, {
        offers,
        order_updates: orderUpdates,
        newsletter,
      });
      setSuccess("Preferences saved");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Preferences" subtitle="Choose which notifications you want to receive." />
      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? <div className="mt-2"><Alert type="success">{success}</Alert></div> : null}

      <div className="max-w-2xl">
        <Card title="Notification Types" right={<Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>}>
          <div className="space-y-3">
            <ToggleRow
              label="Offers"
              hint="Promotions and discounts"
              checked={offers}
              onChange={setOffers}
            />
            <ToggleRow
              label="Order Updates"
              hint="Delivery and order status updates"
              checked={orderUpdates}
              onChange={setOrderUpdates}
            />
            <ToggleRow
              label="Newsletter"
              hint="Monthly updates and announcements"
              checked={newsletter}
              onChange={setNewsletter}
            />
          </div>

          {loading ? (
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading current preferences…</div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
