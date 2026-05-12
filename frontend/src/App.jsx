import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartDrawerProvider } from "./context/CartDrawerContext";
import { CartProvider } from "./context/CartContext";
import CartSidebar from "./components/CartSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MenuOrder from "./pages/admin/MenuOrder";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import Reports from "./pages/admin/Reports";
import Users from "./pages/customer/Users";
import Home from "./pages/Home";
import Menu from "./pages/customer/Menu";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import History from "./pages/customer/History";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartDrawerProvider>
        <CartProvider>
        <CartSidebar />
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/history" element={<History />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<Orders />} />
              <Route path="menu-order" element={<MenuOrder />} />
              <Route path="products" element={<Products />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>
        </Routes>
        </CartProvider>
        </CartDrawerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
