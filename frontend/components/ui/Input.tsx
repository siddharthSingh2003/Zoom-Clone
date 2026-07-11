import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-card-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-zoom-blue/40 focus:border-zoom-blue ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export default Input;
