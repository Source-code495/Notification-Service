import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { formatDateTime } from "../../utils/format";
import { getMyLogs } from "../../services/logService";
import { getErrorMessage } from "../../services/http";
import { Eye } from "lucide-react";

export default function UserNotifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);
  
  const [filters, setFilters] = useState({
    q: "",
    type: "all",
    from: "",
    to: ""
  });

  async function fetchLogs(pageToUse = 1, currentFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await getMyLogs({ 
          page: pageToUse, 
          limit: 10,
          q: currentFilters.q,
          type: currentFilters.type,
          from: currentFilters.from,
          to: currentFilters.to
      });
      setLogs(data.items || []);
      setMeta(data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
      setPage(data?.meta?.page || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Debounce the fetch when filters change
    const t = setTimeout(() => {
        setPage(1);
        void fetchLogs(1, filters);
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  const handlePageChange = (newPage) => {
    fetchLogs(newPage, filters);
  };

  const logType = (log) => {
    if (log?.order) return "order_updates";
    if (log?.newsletterArticle) return "newsletter";
    return log?.campaign?.notification_type || "";
  };

  const badgeColor = (type) => {
    switch (type) {
      case "offers":
        return "green";
      case "order_updates":
        return "blue";
      case "newsletter":
        return "yellow";
      default:
        return "slate";
    }
  };

  return (
    <div>
      <PageHeader title="My Notifications" subtitle="Push notifications sent to you (based on your push preferences)." />

      {error ? <Alert type="error" className="mb-4">{error}</Alert> : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Input 
            placeholder="Search..." 
            value={filters.q}
            onChange={(e) => setFilters(p => ({ ...p, q: e.target.value }))}
        />
        <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.type}
            onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}
        >
            <option value="all">All Types</option>
            <option value="offers">Offers</option>
          <option value="order_updates">Order Updates</option>
            <option value="newsletter">Newsletter</option>
        </select>
        <Input 
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(p => ({ ...p, from: e.target.value }))}
            placeholder="From Date"
        />
        <Input 
            type="date"
            value={filters.to}
            onChange={(e) => setFilters(p => ({ ...p, to: e.target.value }))}
            placeholder="To Date"
        />
      </div>

      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500">Loading notifications...</div>
        ) : logs.length === 0 ? (
           <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
             No notifications found.
           </div>
        ) : (
          logs.map((log) => (
            (() => {
              const type = logType(log);
              const title = log?.campaign
                ? log.campaign.campaign_name
                : log?.newsletterArticle
                  ? `${log.newsletterArticle.newsletter?.title ? `${log.newsletterArticle.newsletter.title} / ` : ""}${log.newsletterArticle.title}`
                : log?.order
                  ? `Order #${log.order.id.slice(0, 8)}...`
                  : "Notification";

              const description = log?.campaign
                ? log.campaign.campaign_message
                : log?.newsletterArticle
                  ? log.newsletterArticle.message
                : log?.order
                  ? `Your order status is ${(log?.status || "").replace(/_/g, " ")}.`
                  : "";

              return (
            <div
              key={log.id}
              className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                   <Badge color={badgeColor(type)}>
                     {type ? type.replace(/_/g, " ") : ""}
                   </Badge>
                   <span className="text-xs text-slate-500 dark:text-slate-400">
                     {formatDateTime(log.sent_at)}
                   </span>
                </div>
                <Eye className="h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </div>
            </div>
              );
            })()
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
            <Button 
                variant="secondary" 
                disabled={!meta.hasPrev || loading} 
                onClick={() => handlePageChange(page - 1)}
            >
                Prev
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
                Page {meta.page} of {meta.totalPages}
            </span>
            <Button 
                variant="secondary" 
                disabled={!meta.hasNext || loading} 
                onClick={() => handlePageChange(page + 1)}
            >
                Next
            </Button>
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={
            selectedLog.campaign
              ? selectedLog.campaign.campaign_name
              : selectedLog.newsletterArticle
                ? `${selectedLog.newsletterArticle.newsletter?.title ? `${selectedLog.newsletterArticle.newsletter.title} / ` : ""}${selectedLog.newsletterArticle.title}`
                : selectedLog.order
                  ? `Order #${selectedLog.order.id.slice(0, 8)}...`
                  : "Notification"
          }
          className="max-w-2xl"
        >
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
               <Badge className="capitalize">{logType(selectedLog).replace(/_/g, " ")}</Badge>
               <span className="text-sm text-slate-500">
                 Received on {formatDateTime(selectedLog.sent_at)}
               </span>
             </div>

             {selectedLog.newsletterArticle ? (
               <>
                 <div className="rounded-md bg-slate-50 p-4 text-slate-800 dark:bg-slate-900 dark:text-slate-200 whitespace-pre-wrap">
                   {selectedLog.newsletterArticle.message}
                 </div>

                 {selectedLog.newsletterArticle.newsletter?.cover_image_url && (
                   <div className="mt-4">
                     <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Attachment</div>
                     <img
                       src={selectedLog.newsletterArticle.newsletter.cover_image_url}
                       alt="Newsletter cover"
                       className="max-h-96 w-full rounded-md object-contain bg-slate-100 dark:bg-slate-800"
                     />
                   </div>
                 )}
               </>
             ) : selectedLog.campaign ? (
               <>
                 <div className="rounded-md bg-slate-50 p-4 text-slate-800 dark:bg-slate-900 dark:text-slate-200 whitespace-pre-wrap">
                   {selectedLog.campaign.campaign_message}
                 </div>

                 {selectedLog.campaign.image_url && (
                   <div className="mt-4">
                     <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Attachment</div>
                     <img
                       src={selectedLog.campaign.image_url}
                       alt="Notification Attachment"
                       className="max-h-96 w-full rounded-md object-contain bg-slate-100 dark:bg-slate-800"
                     />
                   </div>
                 )}
               </>
             ) : selectedLog.order ? (
               <div className="mt-4">
                 <div className="rounded-md bg-slate-50 p-4 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                   <div className="text-sm text-slate-500">Order Status</div>
                   <div className="font-semibold">{selectedLog?.status.replace(/_/g, " ")}</div>
                   {typeof selectedLog.order.total_amount === "number" ? (
                     <div className="mt-2 text-sm text-slate-500">Total: ${selectedLog.order.total_amount.toFixed(2)}</div>
                   ) : null}
                 </div>
               </div>
             ) : null}
             
             <div className="flex justify-end pt-4">
               <Button onClick={() => setSelectedLog(null)}>Close</Button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
