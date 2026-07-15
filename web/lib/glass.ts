import { animate, spring } from 'animejs';

/**
 * The liquid-glass sliding indicator shared by the header tabs, the admin nav
 * and every segmented toggle.
 *
 * Besides springing along the horizontal axis, the pill deforms on the VERTICAL
 * one: it squashes (and stretches sideways) as it takes off, then wobbles back
 * to square as it settles — the give of a blob of liquid rather than a rigid
 * rectangle. The deformation scales with how far the pill has to travel, so a
 * neighbouring tab barely ripples while a jump across the row really stretches.
 */
export function slideGlass(
  el: HTMLElement,
  { left, width, distance }: { left: number; width: number; distance: number }
) {
  const travel = Math.min(1, Math.abs(distance) / 260); // 0 (next door) → 1 (across the row)
  const squash = 0.06 + 0.16 * travel;

  animate(el, {
    left,
    width,
    opacity: 1,
    ease: spring({ bounce: 0.4, duration: 620 }),
  });

  // Separate tween: the deformation has its own, snappier timing than the slide.
  animate(el, {
    scaleY: [
      { to: 1 - squash, duration: 160, ease: 'outQuad' },
      { to: 1, duration: 520, ease: spring({ bounce: 0.6, duration: 520 }) },
    ],
    scaleX: [
      { to: 1 + squash * 0.6, duration: 160, ease: 'outQuad' },
      { to: 1, duration: 520, ease: spring({ bounce: 0.5, duration: 520 }) },
    ],
  });
}

/** Snap the indicator into place with no motion (first paint, resize, reduce-motion). */
export function snapGlass(el: HTMLElement, { left, width }: { left: number; width: number }) {
  el.style.left = `${left}px`;
  el.style.width = `${width}px`;
  el.style.transform = 'scale(1, 1)';
  el.style.opacity = '1';
}
