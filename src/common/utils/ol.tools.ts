import { Color } from "ol/color";
import { ColorLike } from "ol/colorlike";

export const olColorToCss = (color: Color | ColorLike | undefined): string => {
  if (!color) { return ''; }

  // Already a CSS color string
  if (typeof color === "string") {
    return color;
  }

  // Array format: [r, g, b] or [r, g, b, a]
  if (Array.isArray(color)) {
    const [r, g, b, a] = color;

    // Clamp values just in case
    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max);

    const rr = clamp(r, 0, 255);
    const gg = clamp(g, 0, 255);
    const bb = clamp(b, 0, 255);

    if (a === undefined || a === 1) {
      return `rgb(${rr}, ${gg}, ${bb})`;
    }

    const aa = clamp(a, 0, 1);
    return `rgba(${rr}, ${gg}, ${bb}, ${aa})`;
  }

  return '';
}
