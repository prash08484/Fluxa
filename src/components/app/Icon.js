/**
 * Minimal inline-SVG icon set. Stroke-based, sized via `size` prop.
 * Keeping it inline avoids pulling a 300KB icon library for 6 glyphs.
 */
export function Icon({ name, size = 18, className = "" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className,
  };
  switch (name) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
      );
    case "wand":
      return (
        <svg {...props}>
          <path d="M3 21 14 10" />
          <path d="m16.5 7.5 1-1M19 5l1-1M14 5l1 1M17 8l1 1M19 14l1 1M21 11l1 1" />
          <path d="M16 8 8 16" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M18.5 5.5l-2.8 2.8M8.3 15.7l-2.8 2.8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "pen":
      return (
        <svg {...props}>
          <path d="M14 4 20 10 8 22H2v-6L14 4z" />
          <path d="m12 6 6 6" />
        </svg>
      );
    case "image":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="m3 17 5-5 4 4 3-3 6 6" />
        </svg>
      );
    case "gauge":
      return (
        <svg {...props}>
          <path d="M3 14a9 9 0 1 1 18 0" />
          <path d="M12 14 16 8" />
          <circle cx="12" cy="14" r="1" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M15 17l5-5-5-5" />
          <path d="M20 12H9" />
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...props}>
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
        </svg>
      );
    default:
      return null;
  }
}
