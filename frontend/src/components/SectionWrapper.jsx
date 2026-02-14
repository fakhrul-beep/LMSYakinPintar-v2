import React from "react";

export default function SectionWrapper({ id, title, subtitle, children, className = "" }) {
  return (
    <section id={id} className={`py-16 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg font-medium text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
