import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

const API = "http://127.0.0.1:8000/api/orders";

function History() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(API, { headers })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">Order History</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg">No orders yet</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-400">Order #{order.id}</span>
                    <span className="ml-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === "pending"
                      ? "bg-yellow-900/50 text-yellow-300"
                      : order.status === "processing"
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-green-900/50 text-green-300"
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {item.product?.name ?? "Product"} x{item.quantity}
                      </span>
                      <span className="text-white">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
                  <span className="text-sm text-gray-400">
                    {order.payment_method?.toUpperCase()} — {order.payment_status}
                  </span>
                  <span className="text-lg font-bold text-white">
                    ${parseFloat(order.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
