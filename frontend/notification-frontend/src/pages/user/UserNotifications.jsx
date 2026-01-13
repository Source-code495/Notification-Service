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

  return (
    <div>
      <PageHeader title="My Notifications" subtitle="All notifications sent to you." />

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
            <div
              key={log.id}
              className="group relative flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                   <Badge color={
                     log.campaign.notification_type === 'offers' ? 'green' : 
                     log.campaign.notification_type === 'order_updates' ? 'blue' : 'purple'
                   }>
                     {log.campaign.notification_type}
                   </Badge>
                   <span className="text-xs text-slate-500 dark:text-slate-400">
                     {formatDateTime(log.sent_at)}
                   </span>
                </div>
                <Eye className="h-4 w-4 text-slate-400 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {log.campaign.campaign_name}
                </h3>
                <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                  {log.campaign.campaign_message}
                </p>
              </div>
            </div>
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
          title={selectedLog.campaign.campaign_name}
          className="max-w-2xl"
        >
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
               <Badge className="capitalize">{selectedLog.campaign.notification_type.replace('_', ' ')}</Badge>
               <span className="text-sm text-slate-500">
                 Received on {formatDateTime(selectedLog.sent_at)}
               </span>
             </div>

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
             
             <div className="flex justify-end pt-4">
               <Button onClick={() => setSelectedLog(null)}>Close</Button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
