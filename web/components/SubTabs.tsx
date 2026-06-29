"use client";

import React from "react";

const ACCENT = "#0D5EAF";

export interface SubTabOption {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

/** Shared two-up (or more) segmented control used by Governance ▸ Town Hall and
 *  Governance ▸ Communities, so both read identically. */
export default function SubTabs({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SubTabOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 mb-4 ${className}`}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border transition-all active:scale-95"
            style={active ? { backgroundColor: ACCENT, color: "#fff", borderColor: ACCENT } : { borderColor: ACCENT + "44", color: ACCENT }}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
