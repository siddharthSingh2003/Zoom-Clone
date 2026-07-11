import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-zoom-blue hover:bg-zoom-blue-dark text-white",
  secondary: "bg-white hover:bg-gray-50 text-zoom-blue border border-card-border",
  danger: "bg-zoom-red hover:bg-red-600 text-white",
  ghost: "bg-transparent hover:bg-white/10 text-white",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
