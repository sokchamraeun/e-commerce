import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("http://127.0.0.1:8000/api/users").then((r) => r.json()),
      fetch("http://127.0.0.1:8000/api/products", { headers }).then((r) => r.json()),
    ]).then(([users, products]) => {
      setStats({
        totalUsers: users.length,
        totalProducts: Array.isArray(products) ? products.length : 0,
        totalCities: new Set(users.map((u) => u.address?.city)).size,
      });
    });
  }, [token]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Cities</p>
          <p className="text-3xl font-bold text-gray-800">
            {stats ? stats.totalCities : "..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
