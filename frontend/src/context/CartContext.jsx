import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCartCount = () => setRefreshKey((k) => k + 1);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCartCount, refreshKey }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
