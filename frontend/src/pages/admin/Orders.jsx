import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API = "http://127.0.0.1:8000/api/admin/orders";

function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback((silent) => {
    if (!silent) setLoading(true);
    fetch(API, { headers })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => !silent && setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const markPaid = async (id) => {
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
                    {order.payment_method === "cash" && order.payment_status === "unpaid" && order.status !== "shipped" && (
                      <button
                        onClick={() => markPaid(order.id)}
                        className="cursor-pointer rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-600"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;
