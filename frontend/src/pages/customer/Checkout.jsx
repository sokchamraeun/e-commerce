import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import QRCode from "qrcode";

const API = "http://127.0.0.1:8000/api";

function Checkout() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrExpired, setQrExpired] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);
  const navigateRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    payment_method: "cash",
  });
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/cart`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch cart");
        return res.json();
      })
      .then((data) => {
        if (!data.items?.length) {
          navigate("/cart");
          return;
        }
        setCart(data);
        setLoading(false);
      })
      .catch(() => {
        navigate("/cart");
      });
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const order = await res.json();
      if (form.payment_method === "khqr") {
        setPendingOrder(order);
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    clearInterval(pollingRef.current);
    clearInterval(countdownRef.current);
    navigate("/", { replace: true });
  };

  const handleConfirmPayment = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/orders/${pendingOrder.id}/pay`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Payment failed");
      clearInterval(pollingRef.current);
      goHome();
    } catch {
      setError("Payment confirmation failed. Please try again.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!pendingOrder?.khqr_code) return;
    QRCode.toDataURL(pendingOrder.khqr_code, { width: 300, margin: 2 }, (err, url) => {
      if (!err) setQrDataUrl(url);
    });
  }, [pendingOrder]);

  useEffect(() => {
    if (!pendingOrder) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/orders/${pendingOrder.id}/payment-status`, { headers });
        const data = await res.json();
        if (data.status === "paid") {
          goHome();
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [pendingOrder]);

  useEffect(() => {
    if (!pendingOrder || qrExpired) return;
    setQrExpired(false);
    setCountdown(60);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [pendingOrder]);

  const handleRegenerateQr = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/orders/${pendingOrder.id}/regenerate-qr`, {
        method: "POST",
        headers,
      });
      if (!res.ok) throw new Error("Failed to regenerate QR");
      const data = await res.json();
      setPendingOrder((prev) => ({ ...prev, khqr_code: data.khqr_code, transaction_id: data.transaction_id }));
      setQrExpired(false);
      setCountdown(60);
    } catch {
      setError("Failed to regenerate QR. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-white">Checkout</h1>

        {pendingOrder ? (
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
                <h2 className="mb-4 text-lg font-semibold text-white">Scan to Pay</h2>
                <p className="mb-3 text-xs text-gray-400">Scan with Wing, Bakong, or any banking app</p>

                {qrExpired ? (
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-gray-700 p-4">
                    <span className="text-4xl text-gray-500">⏰</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="KHQR Code"
                    className="mx-auto rounded-lg"
                  />
                ) : (
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  </div>
                )}

                <p className="mt-4 text-lg font-bold text-white">
                  Amount: ${parseFloat(pendingOrder.total_price).toFixed(2)}
                </p>

                {!qrExpired && (
                  <p className="mt-2 text-sm text-gray-400">
                    QR expires in <span className="font-mono text-yellow-400">{countdown}s</span>
                  </p>
                )}

                {qrExpired && (
                  <p className="mt-3 text-sm text-red-400">QR code expired. Please regenerate.</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {qrExpired ? (
                <button
                  onClick={handleRegenerateQr}
                  disabled={submitting}
                  className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Regenerating..." : "Regenerate QR"}
                </button>
              ) : (
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting}
                  className="w-full cursor-pointer rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "I've Paid - Confirm"}
                </button>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Order # {pendingOrder.id}</h2>
                <div className="space-y-3">
                  {pendingOrder.items?.map((item) => (
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
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Total</span>
                    <span>${pendingOrder.total_price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-5">
            <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-3">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Shipping Details</h2>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Phone *</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 outline-none focus:border-blue-500"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 transition hover:bg-gray-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-900/20">
                    <input
                      type="radio"
                      name="payment_method"
                      value="khqr"
                      checked={form.payment_method === "khqr"}
                      onChange={handleChange}
                      className="h-4 w-4 accent-blue-500"
                    />
                    <div>
                      <span className="font-medium text-white">KHQR / Wing Pay</span>
                      <p className="text-xs text-gray-400">Scan QR code with any banking app</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 transition hover:bg-gray-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-900/20">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={form.payment_method === "cash"}
                      onChange={handleChange}
                      className="h-4 w-4 accent-blue-500"
                    />
                    <div>
                      <span className="font-medium text-white">Cash</span>
                      <p className="text-xs text-gray-400">Pay on delivery</p>
                    </div>
                  </label>
                </div>
              </div>

              {form.payment_method === "khqr" && (
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
                  <h2 className="mb-4 text-lg font-semibold text-white">Scan to Pay</h2>
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4">
                    <span className="text-6xl">🏦</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">
                    Scan with Wing, Bakong, ABA or any banking app
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : "Place Order"}
              </button>
            </form>

            <div className="lg:col-span-2">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Order Summary</h2>
                <div className="space-y-3">
                  {cart.items.map((item) => (
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
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Total</span>
                    <span>${cart.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
