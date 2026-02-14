import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbMap = {
    tutors: "Daftar Guru",
    blog: "Blog & Artikel",
    testimonials: "Testimoni",
    "daftar-murid": "Daftar Murid",
    "daftar-guru": "Daftar Guru",
  };

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-500 mb-6">
      <Link
        to="/"
        className="flex items-center hover:text-primary transition-colors"
      >
        <Home size={14} className="mr-1" />
        Beranda
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const label = breadcrumbMap[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <React.Fragment key={name}>
            <ChevronRight size={14} className="text-slate-300" />
            {isLast ? (
              <span className="text-slate-900 font-semibold">{label}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-primary transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
