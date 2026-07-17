/**
 * Hand-drawn curved arrow built from a single SVG path that "draws" itself
 * via stroke-dashoffset. Customise via the `path`, `color`, `delay` props.
 */
export function CurvedArrow({
  path,
  width = 200,
  height = 200,
  color = "var(--accent)",
  strokeWidth = 2,
  delay = "0.3s",
  length = 1200,
  className = "",
  withHead = true,
  rotate = 0,
  label,
  labelClassName = "",
  labelStyle,
}) {
  const headId = `head-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        overflow="visible"
      >
        {withHead && (
          <defs>
            <marker
              id={headId}
              markerWidth="10"
              markerHeight="10"
              refX="6"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L8,5 L0,10 z" fill={color} />
            </marker>
          </defs>
        )}
        <path
          d={path}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="draw-path"
          style={{ "--len": length, "--delay": delay }}
          markerEnd={withHead ? `url(#${headId})` : undefined}
        />
      </svg>
      {label && (
        <span
          className={`font-hand absolute text-lg ${labelClassName}`}
          style={labelStyle}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * A loose squiggle underline that draws itself under a heading.
 */
export function Squiggle({
  width = 220,
  color = "var(--accent)",
  delay = "0.5s",
  className = "",
}) {
  return (
    <svg
      width={width}
      height="16"
      viewBox="0 0 220 16"
      fill="none"
      className={`absolute -bottom-2 left-0 ${className}`}
      aria-hidden
    >
      <path
        d="M2 10 Q 20 2, 40 10 T 80 10 T 120 10 T 160 10 T 200 10 T 218 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="draw-path"
        style={{ "--len": 260, "--delay": delay }}
      />
    </svg>
  );
}
