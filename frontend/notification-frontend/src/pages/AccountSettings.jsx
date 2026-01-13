import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FormField } from "../components/ui/FormField";

import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/http";
import { changeMyPassword, getMe, updateMe } from "../services/userService";
import { cn } from "../lib/utils";
import {updatePreferences } from "../services/preferenceService";
import { INDIAN_CITIES } from "../constants/cities";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function AccountSettings() {
  const { role } = useAuth();

  const profileTabLabel = useMemo(() => {
    const r = String(role || "").toLowerCase();
    if (r === "admin") return "Admin Profile";
    if (r === "creator") return "Creator Profile";
    if (r === "viewer") return "Viewer Profile";
    return "User Profile";
  }, [role]);

  const [tab, setTab] = useState("profile");

  const [offers, setOffers] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [me, setMe] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function loadMe() {
    setLoading(true);
    setError("");
    try {
      const data = await getMe();
      setMe(data);
      setName(data?.name || "");
      setEmail(data?.email || "");
      setPhone(data?.phone || "");
      setCity(data?.city || "");
      setOffers(!!data?.preference?.offers);
      setOrderUpdates(!!data?.preference?.order_updates);
      setNewsletter(!!data?.preference?.newsletter);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  async function onSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateMe({ name, phone, city });

const prefUpdated = await updatePreferences(me.user_id, {
  offers,
  order_updates: orderUpdates,
  newsletter,
});

setMe({
  ...updated,
  preference: prefUpdated
});
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(e) {
    e.preventDefault();
    setChangingPw(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setChangingPw(false);
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChangingPw(false);
    }
  }

  const activeBadge = me?.is_active ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/40 bg-emerald-900/20 px-3 py-1 text-xs font-semibold text-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active Account
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-rose-900/40 bg-rose-900/20 px-3 py-1 text-xs font-semibold text-rose-200">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
      Inactive
    </span>
  );

  return (
    <div>
      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile information and security settings"
      />

      {error ? <Alert type="error">{error}</Alert> : null}
      {success ? (
        <div className="mt-2">
          <Alert type="success">{success}</Alert>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-slate-800/70 bg-slate-950/40 shadow-2xl backdrop-blur">
        {/* Tabs */}
        <div className="flex flex-col gap-3 border-b border-slate-800/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-1">
            <button
              type="button"
              onClick={() => {
                setTab("profile");
                setError("");
                setSuccess("");
              }}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "profile"
                  ? "bg-blue-600/20 text-blue-200"
                  : "text-slate-300 hover:bg-slate-900/40 hover:text-white"
              )}
            >
              {profileTabLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("security");
                setError("");
                setSuccess("");
              }}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "security"
                  ? "bg-blue-600/20 text-blue-200"
                  : "text-slate-300 hover:bg-slate-900/40 hover:text-white"
              )}
            >
              Security
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            {activeBadge}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="text-sm text-slate-300">Loading…</div>
          ) : tab === "profile" ? (
            <div className="mx-auto max-w-md">
              <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-950/50 to-slate-900/30 p-5 shadow-xl">
                <div className="flex flex-col items-center gap-3 border-b border-slate-800/60 pb-4">
                  <div className="relative">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-900 ring-2 ring-blue-600/30">
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound className="h-9 w-9 text-slate-200" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm font-semibold text-slate-100">
                      {me?.name || "—"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {me?.role ? String(me.role).toUpperCase() : "—"}
                    </div>
                  </div>
                </div>

                <form className="mt-4 space-y-3" onSubmit={onSaveProfile}>
                  <FormField label="Full Name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!editing}
                      placeholder="Your name"
                    />
                  </FormField>

                  <FormField
                    label="Email Address"
                    hint="Email address cannot be changed."
                  >
                    <Input value={email || "—"} disabled />
                  </FormField>

                  <FormField label="Mobile Number">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!editing}
                      placeholder="e.g. 923xxxxxxxxx"
                    />
                  </FormField>

                  <FormField label="City">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!editing}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 disabled:opacity-50"
                    >
                      <option value="">Select a city</option>
                      {INDIAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="pt-4">
                    <div className="mb-2 text-sm font-semibold text-slate-100">
                      Notification Preferences
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                        <span className="text-sm text-slate-300">
                          Offers & Promotions
                        </span>
                        <input
                          type="checkbox"
                          checked={offers}
                          onChange={(e) => setOffers(e.target.checked)}
                          disabled={!editing}
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                        <span className="text-sm text-slate-300">
                          Order Updates
                        </span>
                        <input
                          type="checkbox"
                          checked={orderUpdates}
                          onChange={(e) => setOrderUpdates(e.target.checked)}
                          disabled={!editing}
                        />
                      </label>

                      <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                        <span className="text-sm text-slate-300">
                          Newsletter
                        </span>
                        <input
                          type="checkbox"
                          checked={newsletter}
                          onChange={(e) => setNewsletter(e.target.checked)}
                          disabled={!editing}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Member Since
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {formatDate(me?.created_at)}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Last Updated
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-100">
                        {formatDate(me?.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    {!editing ? (
                      <Button
                        type="button"
                        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400"
                        onClick={() => {
                          setEditing(true);
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400"
                        >
                          {saving ? "Saving…" : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1 rounded-2xl"
                          onClick={() => {
                            setEditing(false);
                            setName(me?.name || "");
                            setPhone(me?.phone || "");
                            setCity(me?.city || "");
                            setError("");
                            setSuccess("");
                            setOffers(me?.preference?.offers || false);
                            setOrderUpdates(me?.preference?.order_updates || false);
                            setNewsletter(me?.preference?.newsletter || false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md">
              <div className="rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-950/50 to-slate-900/30 p-5 shadow-xl">
                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-200 ring-1 ring-blue-500/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      Security Settings
                    </div>
                    <div className="text-xs text-slate-400">
                      Regularly update your password to maintain account
                      security
                    </div>
                  </div>
                </div>

                <form className="mt-4 space-y-3" onSubmit={onChangePassword}>
                  <FormField label="Current Password">
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FormField>

                  <FormField label="New Password" hint="Minimum 6 characters.">
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FormField>

                  <FormField label="Confirm New Password">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </FormField>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={changingPw}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400"
                    >
                      {changingPw ? "Updating…" : "Update Password"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
