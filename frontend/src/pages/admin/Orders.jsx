import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import printReceipt from "./printReceipt";

const API = "http://127.0.0.1:8000/api/admin/orders";

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailOrder, setDetailOrder] = useState(null);
  const pageRef = useRef(page);

  const fetchOrders = useCallback((silent) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (!silent) setLoading(true);
    fetch(`${API}?page=${pageRef.current}&per_page=10`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((res) => {
        setOrders(res.data ?? []);
        setPage(res.current_page ?? 1);
        setLastPage(res.last_page ?? 1);
        setTotal(res.total ?? 0);
      })
      .catch(() => setOrders([]))
      .finally(() => !silent && setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const goToPage = (p) => {
    pageRef.current = p;
    setPage(p);
    fetchOrders(true);
  };

  const markPaid = async (id) => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const res = await fetch(`${API}/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ payment_status: "paid", status: "processing" }),
      });
      if (!res.ok) throw new Error();
      fetchOrders();
    } catch {
      alert("Failed to update order");
    }
  };

  const handlePrint = (order) => {
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    fetch(`${API}/${order.id}/print-log`, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "receipt" }),
    }).then(() => fetchOrders(true)).catch(() => {});
    printReceipt(order);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Orders</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="py-10 text-center text-gray-500">No orders yet</div>
      )}

      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-left">Phone</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Payment</th>
                <th className="p-4 text-left">Payment Status</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b transition hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-700">#{order.id}</td>
                  <td className="p-4 text-gray-700">{order.name || order.user?.name || "-"}</td>
                  <td className="p-4 text-gray-600">{order.phone || "-"}</td>
                  <td className="p-4 font-medium text-gray-700">
                    ${parseFloat(order.total_price).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.payment_method === "khqr"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {order.payment_method?.toUpperCase() || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : order.payment_status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {order.payment_status || "unpaid"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="cursor-pointer rounded-lg bg-indigo-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-600"
                      >
                        View
                      </button>
                      {order.payment_method === "cash" && order.payment_status === "unpaid" && order.status !== "shipped" && (
                        <button
                          onClick={() => markPaid(order.id)}
                          className="cursor-pointer rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-600"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handlePrint(order)}
                        className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium text-white transition ${
                          order.print_logs_exists
                            ? "bg-gray-400 hover:bg-gray-500"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {order.print_logs_exists ? "Printed" : "Print"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="cursor-pointer rounded-lg px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: lastPage }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => goToPage(p)}
                      className={`cursor-pointer rounded-lg px-3 py-1 text-sm font-medium transition ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => goToPage(Math.min(lastPage, page + 1))}
                disabled={page === lastPage}
                className="cursor-pointer rounded-lg px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailOrder(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Order #{detailOrder.id}</h2>
              <button onClick={() => setDetailOrder(null)} className="cursor-pointer text-2xl leading-none text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div className="mb-4 space-y-1 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Customer:</span> {detailOrder.name || detailOrder.user?.name || "-"}</p>
              <p><span className="font-medium text-gray-800">Phone:</span> {detailOrder.phone || "-"}</p>
              <p><span className="font-medium text-gray-800">Date:</span> {new Date(detailOrder.created_at).toLocaleDateString()}</p>
              <p><span className="font-medium text-gray-800">Payment:</span> <span className="capitalize">{detailOrder.payment_method || "N/A"}</span></p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 text-center font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(detailOrder.items || []).map((item, i) => (
                  <tr key={item.id || i} className="border-b last:border-0">
                    <td className="py-2 text-gray-700">{item.product?.name || "Item"}</td>
                    <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-600">${parseFloat(item.price).toFixed(2)}</td>
                    <td className="py-2 text-right font-medium text-gray-700">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between border-t pt-3 text-base font-bold text-gray-800">
              <span>Total</span>
              <span>${parseFloat(detailOrder.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
