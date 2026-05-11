import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200",
    title: "Latest Smartphones",
    subtitle: "Discover the newest tech at unbeatable prices.",
  },
  {
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
    title: "Top Brands, Best Deals",
    subtitle: "Upgrade your gadgets today.",
  },
  {
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=1200",
    title: "Accessories & More",
    subtitle: "Everything you need in one place.",
  },
];

function HeroSection() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const { image, title, subtitle } = slides[current];

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-black/40" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{title}</h1>
        <p className="mb-8 max-w-lg text-lg text-gray-200">{subtitle}</p>
        <Link
          to="/menu"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-700"
        >
          Browse Menu
        </Link>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
      >
        ❮
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40"
      >
        ❯
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 w-2 rounded-full transition ${
              i === current ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroSection;
