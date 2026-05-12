import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const API = "http://127.0.0.1:8000/api";

const periods = [
  { key: "daily", label: "Daily" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/users`).then((r) => r.json()),
      fetch(`${API}/products`, { headers }).then((r) => r.json()),
      fetch(`${API}/admin/orders/stats`, { headers }).then((r) => r.json()),
    ]).then(([users, products, orders]) => {
      setStats({
        totalUsers: users.length,
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalOrders: orders.totalOrders ?? 0,
        pendingOrders: orders.pending ?? 0,
        revenue: orders.revenue ?? "0.00",
      });
    });
  }, [token]);

  useEffect(() => {
    fetch(`${API}/admin/orders/chart-data?period=${period}`, { headers })
      .then((r) => r.json())
      .then((data) => setChartData(Array.isArray(data) ? data : []))
      .catch(() => setChartData([]));
  }, [token, period]);

  const periodLabel = periods.find((p) => p.key === period)?.label || "Monthly";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats ? stats.totalOrders : "..."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600">
            {stats ? stats.pendingOrders : "..."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            {stats ? `$${stats.revenue}` : "..."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats ? stats.totalUsers : "..."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats ? stats.totalProducts : "..."}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {periodLabel} Orders & Revenue
          </h2>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition ${
                  period === p.key
                    ? "bg-white text-gray-800 shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 13 }} />
            <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 13 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 13 }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
