"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";

// Real Lefkada photographs (Wikimedia Commons, freely licensed; hotlinked via
// the stable Special:FilePath endpoint, scaled down with ?width=).
const wiki = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=1600`;
const VIEWS = [
  wiki("Porto_Katsiki_6108.JPG"),
  wiki("Egremni_Beach_%28Lefkada%2C_Greece%29.jpg"),
  wiki("20100726_Kalamitsi_Beach_Ionian_Sea_Lefkada_island_Greece.jpg"),
  wiki("Sivota%2C_Lefkada%2C_Greece.JPG"),
];

const INTERVAL_MS = 6000;

/** Full-screen, fixed (non-scrolling) auto-crossfading photo backdrop for the
 *  News tab. Sits behind the content; cards scroll over it. */
export default function NewsBackground() {
  const { a11y } = useApp();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (a11y.reduceMotion) return; // hold a single image when motion is reduced
    const id = setInterval(
      () => setIdx((i) => (i + 1) % VIEWS.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [a11y.reduceMotion]);

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
