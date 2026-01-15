import { useEffect, useState, useMemo } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import { formatDateTime } from "../../utils/format";
import { getAllOrders, updateOrderStatus } from "../../services/orderService";
import { getErrorMessage } from "../../services/http";
import { Eye, Save } from "lucide-react";

export default function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    from: "",
    to: ""
  });

  async function fetchOrders(pageToUse = 1, currentFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const data = await getAllOrders({ 
          page: pageToUse, 
          limit: 10,
          q: currentFilters.q,
          status: currentFilters.status,
          from: currentFilters.from,
          to: currentFilters.to
      });
      setOrders(data.items || []);
      setMeta(data.meta || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
        void fetchOrders(1, filters);
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, filters);
  };

  const handleUpdateStatus = async () => {
      if(!selectedOrder || !newStatus) return;
      
      try {
          await updateOrderStatus(selectedOrder.id, newStatus);
          setSuccess("Order status updated successfully");
          // Update local state
          setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
          setTimeout(() => setSuccess(""), 3000);
      } catch(err) {
          setError(getErrorMessage(err));
      }
  };

  const statusColor = (status) => {
      switch(status) {
          case 'ORDER_CONFIRMED': return 'blue';
          case 'SHIPPED': return 'yellow';
          case 'OUT_FOR_DELIVERY': return 'purple';
          case 'DELIVERED': return 'green';
          case 'CANCELLED': return 'red';
          default: return 'gray';
      }
  };

  const columns = useMemo(() => [
      {
          key: "id",
          title: "Order ID",
          render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}...</span>
      },
      {
          key: "user",
          title: "User",
          render: (r) => (
              <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{r.user?.name || "Unknown"}</span>
                  <span className="text-xs text-slate-500">{r.user?.email}</span>
              </div>
          )
      },
      {
          key: "created_at",
          title: "Date",
          render: (r) => <span className="text-sm text-slate-700 dark:text-slate-300">{formatDateTime(r.created_at)}</span>
      },
      {
          key: "total_amount",
          title: "Amount",
          render: (r) => <span className="font-semibold text-slate-900 dark:text-slate-100">${r.total_amount.toFixed(2)}</span>
      },
      {
          key: "status",
          title: "Status",
          render: (r) => <Badge color={statusColor(r.status)}>{r.status.replace(/_/g, ' ')}</Badge>
      },
      {
          key: "actions",
          title: "Actions",
          render: (r) => (
              <Button variant="secondary" className="!p-1.5" onClick={() => {
                  setSelectedOrder(r);
                  setNewStatus(r.status);
              }}>
                  <Eye className="h-4 w-4" />
              </Button>
          )
      }
  ], []);

  return (
    <div>
      <PageHeader title="All Orders" subtitle="Manage user orders and update status." />

      {error ? <Alert type="error" className="mb-4">{error}</Alert> : null}
      {success ? <Alert type="success" className="mb-4">{success}</Alert> : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Input 
            placeholder="Search Order ID, Name, Email..." 
            value={filters.q}
            onChange={(e) => setFilters(p => ({ ...p, q: e.target.value }))}
        />
        <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.status}
            onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
        >
            <option value="all">All Status</option>
            <option value="ORDER_CONFIRMED">Order Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
        </select>
        <Input 
            type="date"
            placeholder="From Date"
            value={filters.from}
            onChange={(e) => setFilters(p => ({ ...p, from: e.target.value }))}
        />
        <Input 
            type="date"
            placeholder="To Date"
            value={filters.to}
            onChange={(e) => setFilters(p => ({ ...p, to: e.target.value }))}
        />
      </div>

      <Table columns={columns} rows={orders} keyField="id" />

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
            <Button 
                variant="secondary" 
                disabled={!meta.hasPrev || loading} 
                onClick={() => handlePageChange(meta.page - 1)}
            >
                Prev
            </Button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
                Page {meta.page} of {meta.totalPages}
            </span>
            <Button 
                variant="secondary" 
                disabled={!meta.hasNext || loading} 
                onClick={() => handlePageChange(meta.page + 1)}
            >
                Next
            </Button>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => { setSelectedOrder(null); setError(""); setSuccess(""); }}
          title={`Order #${selectedOrder.id.slice(0, 8)}...`}
          className="max-w-2xl"
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div>
                        <div className="text-sm text-slate-500">Order Placed</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(selectedOrder.created_at)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Total Amount</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">${selectedOrder.total_amount.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Customer</div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{selectedOrder.user?.name}</div>
                        <div className="text-xs text-slate-500">{selectedOrder.user?.email}</div>
                    </div>
                </div>

                {/* Status Update Section */}
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-900/20">
                    <h4 className="mb-2 text-sm font-semibold text-indigo-900 dark:text-indigo-100">Update Order Status</h4>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                        >
                            <option value="ORDER_CONFIRMED">Order Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <Button onClick={handleUpdateStatus}>
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Items Ordered</h4>
                    <div className="space-y-3">
                        {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                                <div className="h-16 w-16 overflow-hidden rounded-md bg-white">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-1 flex-col justify-center">
                                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.name}</div>
                                    <div className="text-sm text-slate-500">Qty: {item.quantity} x ${item.price}</div>
                                </div>
                                <div className="flex items-center font-semibold text-slate-900 dark:text-slate-100">
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}
