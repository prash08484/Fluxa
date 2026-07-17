export function Button({
  as: Tag = "a",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/40";

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-13 px-7 text-base",
  };

  /* No gradients. Solid neutrals only. */
  const variants = {
    primary:
      "bg-zinc-50 text-zinc-950 hover:bg-white hover:-translate-y-0.5",
    ghost:
      "border border-zinc-50/15 text-zinc-100 hover:bg-zinc-50/5 hover:border-zinc-50/30",
    accent:
      "bg-amber-200 text-zinc-950 hover:bg-amber-100 hover:-translate-y-0.5",
  };

  return (
    <Tag
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
