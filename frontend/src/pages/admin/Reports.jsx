import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://127.0.0.1:8000/api/admin/orders/report";

function Reports() {
  const { token } = useAuth();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = () => {
    setLoading(true);
    fetch(`${API}?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  };

  const s = report?.summary;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Reports</h1>

      <div className="mb-6 flex items-end gap-4 rounded-xl bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-600">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Generate"}
        </button>
      </div>

      {s && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{s.totalOrders}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-green-600">${Number(s.revenue).toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{s.pending}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">Processing</p>
              <p className="text-2xl font-bold text-blue-600">{s.processing}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-xs text-gray-500">Shipped</p>
              <p className="text-2xl font-bold text-green-600">{s.shipped}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">By Payment Method</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Orders</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byPaymentMethod.map((row) => (
                    <tr key={row.payment_method} className="border-b last:border-0">
                      <td className="py-2 capitalize text-gray-700">{row.payment_method}</td>
                      <td className="py-2 text-gray-600">{row.count}</td>
                      <td className="py-2 text-gray-600">${parseFloat(row.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">By Payment Status</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Orders</th>
                    <th className="pb-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byPaymentStatus.map((row) => (
                    <tr key={row.payment_status} className="border-b last:border-0">
                      <td className="py-2 capitalize text-gray-700">{row.payment_status || "N/A"}</td>
                      <td className="py-2 text-gray-600">{row.count}</td>
                      <td className="py-2 text-gray-600">${parseFloat(row.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {report.daily?.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Daily Trend</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!loading && !report && (
        <div className="py-10 text-center text-gray-500">
          Select a date range and click Generate to view the report.
        </div>
      )}
    </div>
  );
}

export default Reports;
