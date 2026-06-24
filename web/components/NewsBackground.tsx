"use client";

import { useEffect, useState } from "react";

// Stylized Lefkada views — swap these paths for real photographs any time.
const VIEWS = [
  "/backgrounds/lefkada-1-ionian.png",
  "/backgrounds/lefkada-2-sunset.png",
  "/backgrounds/lefkada-3-cove.png",
  "/backgrounds/lefkada-4-night.png",
];

const INTERVAL_MS = 6000;

/** Full-screen, fixed (non-scrolling) auto-crossfading photo backdrop for the
 *  News tab. Sits behind the content; cards scroll over it. */
export default function NewsBackground() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % VIEWS.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {VIEWS.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity ease-in-out"
          style={{
            backgroundImage: `url('${src}')`,
            opacity: i === idx ? 1 : 0,
            transitionDuration: "1500ms",
          }}
        />
      ))}
      {/* Legibility scrim so cards and filters stay readable over any photo */}
      <div className="absolute inset-0 bg-[#F2F5F9]/45 dark:bg-[#0B0F18]/60" />
    </div>
  );
}
