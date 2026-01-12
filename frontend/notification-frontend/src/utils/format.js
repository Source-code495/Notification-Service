export function formatDateTime(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    // Force India timezone so log dates match IST even when the server/browser is elsewhere.
    return d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
  } catch {
    return String(value);
  }
}

// Returns YYYY-MM-DD in Asia/Kolkata (lexicographically sortable).
export function toISTDateKey(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

export function safeUpper(value) {
  return String(value || "").toUpperCase();
}
