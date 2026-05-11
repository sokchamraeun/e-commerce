import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import Navbar from "../../components/Navbar";

const API = "http://127.0.0.1:8000/api/cart";

function Cart() {
  const { token } = useAuth();
  const { refreshCartCount } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchCart = () => {
    setLoading(true);
    fetch(API, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch cart");
        return res.json();
      })
      .then((data) => {
        setCart(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const updateQty = async (id, qty) => {
    if (qty < 0) return;
    try {
      await fetch(`${API}/items/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ quantity: qty }),
      });
      fetchCart();
      refreshCartCount();
    } catch {
      // ignore
    }
  };

  const removeItem = async (id) => {
    try {
      await fetch(`${API}/items/${id}`, { method: "DELETE", headers });
      fetchCart();
      refreshCartCount();
    } catch {
      // ignore
    }
  };

  const items = cart?.items ?? [];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">Shopping Cart</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <p className="mb-4 text-lg">Your cart is empty</p>
            <Link
              to="/menu"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Browse Menu
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800 p-4"
                >
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-700">
                    {item.product?.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">📱</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      {item.product?.name ?? "Product"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-600 text-gray-300 transition hover:bg-gray-700"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-gray-600 text-gray-300 transition hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>

                  <div className="w-24 text-right font-semibold text-white">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="cursor-pointer text-red-400 transition hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6">
              <div className="flex items-center justify-between text-lg font-bold text-white">
                <span>Total</span>
                <span>${cart.total}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;
