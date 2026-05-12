import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import QRCode from "qrcode";

const API = "http://127.0.0.1:8000/api";

function MenuOrder() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", payment_method: "cash" });
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetch(`${API}/products`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addItem = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, image: product.image }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i)));
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Customer name and phone are required");
      return;
    }
    if (cart.length === 0) {
      setError("Add at least one item");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/orders/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          payment_method: form.payment_method,
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const order = await res.json();
      if (order.payment_method === "khqr" && order.khqr_code) {
        setPendingOrder(order);
        QRCode.toDataURL(order.khqr_code, { width: 260, margin: 2 }, (err, url) => {
          if (!err) setQrDataUrl(url);
        });
      } else {
        setPendingOrder({ ...order, cash: true });
      }
      setCart([]);
      setForm({ name: "", phone: "", payment_method: "cash" });
    } catch {
      setError("Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      <div className="flex-1 overflow-y-auto">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Menu Order</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <div key={p.id} className="cursor-pointer rounded-xl bg-white p-4 shadow transition hover:shadow-md" onClick={() => addItem(p)}>
                <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-gray-100">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-400">🍽️</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                <p className="text-sm font-bold text-blue-600">${parseFloat(p.price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-96 flex-col rounded-xl bg-white shadow">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-gray-800">
            Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Click products to add</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">🍽️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-300">-</button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600 transition hover:bg-gray-300">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          {pendingOrder ? (
            <div className="text-center">
              {pendingOrder.cash ? (
                <div className="rounded-lg bg-green-100 p-4 text-sm text-green-700">
                  <p className="mb-1 font-semibold">Order #{pendingOrder.id} placed!</p>
                  <p className="text-xs">Payment: Cash</p>
                  <button onClick={() => { setPendingOrder(null); setQrDataUrl(""); }} className="mt-2 cursor-pointer font-semibold underline">New Order</button>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Scan to Pay</p>
                  <p className="mb-2 text-lg font-bold text-gray-800">${parseFloat(pendingOrder.total_price).toFixed(2)}</p>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-lg" />
                  ) : (
                    <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-lg bg-gray-100">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400">Order #{pendingOrder.id}</p>
                  <button onClick={() => { setPendingOrder(null); setQrDataUrl(""); }} className="mt-3 w-full cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700">Done</button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mb-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {error && <p className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-600">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" name="name" placeholder="Customer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <input type="text" name="phone" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <select name="payment_method" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
                  <option value="cash">Cash</option>
                  <option value="khqr">KHQR</option>
                </select>
                <button type="submit" disabled={submitting} className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? "Placing..." : "Place Order"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MenuOrder;
