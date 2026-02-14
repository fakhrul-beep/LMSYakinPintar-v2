import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Komponen ScrollToTop otomatis menggulir halaman ke bagian paling atas
 * setiap kali terjadi perubahan route (pathname).
 * Menggunakan behavior 'smooth' untuk pengalaman pengguna yang optimal.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    };

    // Pastikan DOM sudah siap dan memberikan sedikit jeda untuk render konten React
    if (document.readyState === "complete") {
      const timer = setTimeout(handleScroll, 100);
      return () => clearTimeout(timer);
    } else {
      window.addEventListener("load", handleScroll);
      return () => window.removeEventListener("load", handleScroll);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
