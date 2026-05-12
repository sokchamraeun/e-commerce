import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "📊" },
  { to: "/admin/menu-order", label: "Menu Order", icon: "🛵" },
  { to: "/admin/orders", label: "Orders", icon: "📋" },
  { to: "/admin/reports", label: "Reports", icon: "📈" },
  { to: "/admin/users", label: "Users", icon: "👥" },
  { to: "/admin/products", label: "Products", icon: "📦" },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="border-b border-gray-700 p-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <p className="mb-2 truncate text-sm text-gray-400">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
