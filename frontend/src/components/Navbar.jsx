import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCartDrawer } from "../context/CartDrawerContext";
import logo from "../assets/react.svg";

function Navbar({ overlay }) {
  const { user, logout, token } = useAuth();
  const { cartCount, setCartCount, refreshKey } = useCart();
  const { toggle } = useCartDrawer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setCartCount(0);
      return;
    }
    fetch("http://127.0.0.1:8000/api/cart", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const count = data.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
        setCartCount(count);
      })
      .catch(() => setCartCount(0));
  }, [token, refreshKey]);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const linkClass = overlay
    ? "text-sm font-medium text-white/80 transition hover:text-white"
    : "text-sm font-medium text-gray-700 transition hover:text-blue-600";

  const navClass = overlay
    ? "fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/10 bg-white/10 px-8 py-4 backdrop-blur-md"
    : "sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white/80 px-8 py-4 backdrop-blur-md";

  return (
    <nav className={navClass}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="Logo"
          className="h-10 w-10 rounded-xl bg-white/10 p-1"
        />

        <span
          className={`text-xl font-bold tracking-wide ${
            overlay ? "text-white" : "text-gray-800"
          }`}
        >
          MyApp
        </span>
      </div>

      {/* Navigation */}
      <div className="hidden items-center gap-8 md:flex">
        <Link to="/" className={linkClass}>
          Home
        </Link>

        <Link to="/menu" className={linkClass}>
          Menu
        </Link>

        <Link to="/service" className={linkClass}>
          Service
        </Link>

        <Link to="/history" className={linkClass}>
          History
        </Link>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Cart */}
        <button
          onClick={toggle}
          className={`relative cursor-pointer rounded-full p-2 transition ${
            overlay
              ? "text-white/80 hover:bg-white/10 hover:text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-blue-600"
          }`}
        >
          <span className="text-xl">🛒</span>
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            {/* User Email */}
            <div
              className={`hidden rounded-full px-3 py-1 text-sm md:block ${
                overlay
                  ? "bg-white/10 text-white/80"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {user.name}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Login */}
            <Link
              to="/login"
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                overlay
                  ? "border-white/20 text-white hover:bg-white/10"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Sign In
            </Link>

            {/* Register */}
            <Link
              to="/register"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;