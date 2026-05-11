import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCartDrawer } from "../context/CartDrawerContext";
import logo from "../assets/react.svg";

const API = "http://127.0.0.1:8000/api/cart";

function CartSidebar() {
  const { open, close } = useCartDrawer();
  const { token } = useAuth();
  const { refreshCartCount } = useCart();
  const [cart, setCart] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchCart = () => {
    if (!token) return;
    fetch(API, { headers })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setCart)
      .catch(() => setCart(null));
  };

  useEffect(() => {
    if (open) fetchCart();
  }, [open, token]);

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
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={close}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-gray-900 text-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">MyApp</span>
          </div>
          <button
            onClick={close}
            className="cursor-pointer rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="py-10 text-center text-gray-400">Your cart is empty</div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-gray-700 bg-gray-800 p-3"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-700">
                    {item.product?.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl text-gray-400">📱</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-sm font-semibold text-white">
                      {item.product?.name ?? "Product"}
                    </h4>
                    <p className="text-sm text-gray-400">
                      ${parseFloat(item.price).toFixed(2)}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-600 text-xs text-gray-300 transition hover:bg-gray-700"
                      >
                        -
                      </button>
                      <span className="text-sm text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-gray-600 text-xs text-gray-300 transition hover:bg-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="cursor-pointer text-xs text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                    <span className="text-sm font-semibold text-white">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-700 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-gray-400">Total</span>
              <span className="text-lg font-bold text-white">${cart?.total ?? "0.00"}</span>
            </div>
            <Link
              to="/checkout"
              onClick={close}
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default CartSidebar;
