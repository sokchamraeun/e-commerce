import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API = "http://127.0.0.1:8000/api/products";

function Products() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchProducts = () => {
    setLoading(true);
    fetch(API, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (form) => {
    const res = await fetch(API, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create product");
    await fetchProducts();
  };

  const handleUpdate = async (id, form) => {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update product");
    await fetchProducts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete product");
      }
      await fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => {
            setEditProduct(null);
            setModal("add");
          }}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {modal && (
        <ProductFormModal
          mode={modal}
          product={editProduct}
          onClose={() => setModal(null)}
          onSubmit={async (form) => {
            if (modal === "add") {
              await handleCreate(form);
            } else {
              await handleUpdate(editProduct.id, form);
            }
            setModal(null);
          }}
        />
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-10 text-center text-gray-500">No products found</div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Image</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Qty</th>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b transition hover:bg-gray-50">
                  <td className="p-4">{product.id}</td>
                  <td className="p-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-sm text-gray-500">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-700">{product.name}</td>
                  <td className="p-4 text-gray-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </td>
                  <td className="p-4 text-gray-600">{product.qty}</td>
                  <td className="max-w-xs truncate p-4 text-gray-500">
                    {product.description || "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditProduct(product);
                          setModal("edit");
                        }}
                        className="cursor-pointer rounded-lg bg-yellow-400 px-3 py-1 text-sm text-white transition hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="cursor-pointer rounded-lg bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductFormModal({ mode, product, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    image: product?.image || "",
    price: product?.price || "",
    description: product?.description || "",
    qty: product?.qty || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.name || !form.price || form.qty === "") {
      setErr("Name, price, and quantity are required");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        qty: parseInt(form.qty, 10),
      };
      if (!body.image) delete body.image;
      if (!body.description) delete body.description;
      await onSubmit(body);
    } catch (err) {
      setErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          {mode === "add" ? "Add Product" : "Edit Product"}
        </h2>

        {err && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
            {err}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="text"
            name="image"
            value={form.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Qty</label>
            <input
              type="number"
              name="qty"
              value={form.qty}
              onChange={handleChange}
              min="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : mode === "add" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Products;
