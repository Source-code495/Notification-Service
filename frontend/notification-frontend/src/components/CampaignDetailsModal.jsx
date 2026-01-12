import { useState } from "react";
import Modal from "./ui/Modal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Alert from "./ui/Alert";
import { FormField } from "./ui/FormField";

function normalizeCityFilters(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

export default function CampaignDetailsModal({
  open,
  campaign,
  saving,
  error,
  onClose,
  onSave,
  onSend,
}) {
  const editable = campaign?.status === "draft" && !!onSave;

  const [imageUrl, setImageUrl] = useState(() => campaign?.image_url || "");
  const [cities, setCities] = useState(() => normalizeCityFilters(campaign?.city_filters));
  const [newCity, setNewCity] = useState("");

  function addCity() {
    if (!editable) return;
    const trimmed = newCity.trim();
    if (!trimmed) return;
    const exists = cities.some((c) => String(c).toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewCity("");
      return;
    }
    setCities((prev) => [...prev, trimmed]);
    setNewCity("");
  }

  function removeCity(city) {
    if (!editable) return;
    setCities((prev) => prev.filter((c) => c !== city));
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        Close
      </Button>
      {onSend ? (
        <Button
          variant="secondary"
          disabled={saving || !campaign}
          onClick={() => onSend?.(campaign)}
        >
          {saving ? "Working..." : "Send"}
        </Button>
      ) : null}
      {onSave ? (
        <Button
          disabled={saving || !campaign}
          onClick={() =>
            onSave?.(campaign, {
              image_url: imageUrl,
              city_filters: cities,
            })
          }
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      ) : null}
    </div>
  );

  return (
    <Modal
      open={open}
      title={campaign ? `Campaign: ${campaign.campaign_name}` : "Campaign"}
      onClose={onClose}
      footer={footer}
    >
      {error ? <Alert type="error">{error}</Alert> : null}

      {!campaign ? (
        <div className="text-sm text-slate-600 dark:text-slate-300">No campaign selected.</div>
      ) : (
        <div className="space-y-4">
          {campaign.status !== "draft" ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
              This campaign is <span className="font-semibold">{campaign.status}</span> and cannot be edited.
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Type</div>
              <div className="mt-1">
                <Badge color="blue">{campaign.notification_type}</Badge>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
              <div className="mt-1">
                <Badge color={campaign.status === "sent" ? "green" : "yellow"}>{campaign.status}</Badge>
              </div>
            </div>
          </div>

          {campaign?.creator ? (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Creator</div>
              <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">
                <div className="font-medium">{campaign.creator?.name || "-"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{campaign.creator?.email || "-"}</div>
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Message</div>
            <div className="mt-1 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-100">
              {campaign.campaign_message}
            </div>
          </div>

          <FormField label="Image URL (optional)">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              disabled={!editable}
            />
          </FormField>

          {imageUrl ? (
            <div className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
              <img
                src={imageUrl}
                alt="Campaign"
                className="h-48 w-full rounded-md object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Preview</div>
            </div>
          ) : null}

          <div className="space-y-2">
            <FormField
              label="City filters"
              hint={
                cities.length === 0
                  ? "No cities selected: sending will target all eligible users"
                  : "Users in ANY of these cities will be targeted"
              }
            >
              <div className="flex gap-2">
                <Input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Add city..."
                  disabled={!editable}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCity();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addCity} disabled={!editable}>
                  Add
                </Button>
              </div>
            </FormField>

            <div className="flex flex-wrap gap-2">
              {cities.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No city filters</div>
              ) : (
                cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={editable ? "group" : ""}
                    onClick={editable ? () => removeCity(c) : undefined}
                    title={editable ? "Remove" : undefined}
                    disabled={!editable}
                  >
                    <Badge>
                      <span className={editable ? "mr-1" : ""}>{c}</span>
                      {editable ? (
                        <span className="opacity-60 group-hover:opacity-100">×</span>
                      ) : null}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
