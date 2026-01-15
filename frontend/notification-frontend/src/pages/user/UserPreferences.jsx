import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import { useAuth } from "../../context/AuthContext";
import { getPreferences, updatePreferences } from "../../services/preferenceService";
import { getErrorMessage } from "../../services/http";

function ChannelRow({ label, hint, value, onChange }) {
  const enabledCount = useMemo(() => {
    const v = value || {};
    return [v.sms, v.email, v.push].filter(Boolean).length;
  }, [value]);

  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-50">{label}</div>
        {hint ? <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{enabledCount} channel(s) enabled</div>
      </div>

      <div className="mt-1 flex items-center gap-3">
        <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!value?.sms}
            onChange={(e) => onChange({ ...value, sms: e.target.checked })}
          />
          SMS
        </label>

        <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!value?.email}
            onChange={(e) => onChange({ ...value, email: e.target.checked })}
          />
          Email
        </label>

        <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!value?.push}
            onChange={(e) => onChange({ ...value, push: e.target.checked })}
          />
          Push
        </label>
      </div>
    </label>
  );
}

export default function UserPreferences() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [offers, setOffers] = useState({ sms: false, email: false, push: false });
  const [orderUpdates, setOrderUpdates] = useState({ sms: false, email: false, push: false });
  const [newsletter, setNewsletter] = useState({ sms: false, email: false, push: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const prefs = await getPreferences(userId);
        if (!mounted) return;
        setOffers({
          sms: !!prefs.offers_sms,
          email: !!prefs.offers_email,
          push: prefs.offers_push ?? prefs.offers ?? false,
        });
        setOrderUpdates({
          sms: !!prefs.order_updates_sms,
          email: !!prefs.order_updates_email,
          push: prefs.order_updates_push ?? prefs.order_updates ?? false,
        });
        setNewsletter({
          sms: !!prefs.newsletter_sms,
          email: !!prefs.newsletter_email,
          push: prefs.newsletter_push ?? prefs.newsletter ?? false,
        });
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
        offers_sms: !!offers.sms,
        offers_email: !!offers.email,
        offers_push: !!offers.push,

        order_updates_sms: !!orderUpdates.sms,
        order_updates_email: !!orderUpdates.email,
        order_updates_push: !!orderUpdates.push,

        newsletter_sms: !!newsletter.sms,
        newsletter_email: !!newsletter.email,
        newsletter_push: !!newsletter.push,
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
            <ChannelRow
              label="Offers"
              hint="Promotions and discounts"
              value={offers}
              onChange={setOffers}
            />
            <ChannelRow
              label="Order Updates"
              hint="Delivery and order status updates"
              value={orderUpdates}
              onChange={setOrderUpdates}
            />
            <ChannelRow
              label="Newsletter"
              hint="Monthly updates and announcements"
              value={newsletter}
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
