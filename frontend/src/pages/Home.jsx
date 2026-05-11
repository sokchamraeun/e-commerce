import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";

const API = "http://127.0.0.1:8000/api/products";

function Home() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const addToCart = async (productId) => {
    if (!token) {
      setMessage("Please sign in to add items to cart");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setMessage("Added to cart!");
    } catch {
      setMessage("Failed to add to cart");
    }
  };

  useEffect(() => {
    fetch(API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <HeroSection />

      <section className="px-4 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">Our Menu</h2>

        {message && (
          <div className="mx-auto mb-4 max-w-md rounded-lg bg-green-100 px-4 py-2 text-center text-sm text-green-600">
            {message}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="py-10 text-center text-gray-500">No products available</div>
        )}

        {!loading && products.length > 0 && (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col overflow-hidden rounded bg-white shadow transition hover:shadow-lg"
              >
                <div className="flex h-48 items-center justify-center bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">📱</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    {product.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

export default Home;
