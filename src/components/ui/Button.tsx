import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={clsx(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none",
          // sizes
          size === "sm" && "text-xs px-3 py-1.5 gap-1.5",
          size === "md" && "text-sm px-4 py-2.5 gap-2",
          size === "lg" && "text-base px-6 py-3 gap-2.5",
          // variants
          variant === "primary" && [
            "text-white focus:ring-green-500",
            "shadow-[0_4px_14px_rgba(22,163,74,0.28)]",
            "hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)]",
            "active:scale-[0.98]",
          ],
          variant === "outline" && [
            "border border-slate-200 text-slate-700 bg-white",
            "hover:bg-slate-50 hover:border-slate-300",
            "focus:ring-slate-400",
            "active:scale-[0.98]",
          ],
          variant === "ghost" && [
            "text-slate-600 bg-transparent",
            "hover:bg-slate-100 hover:text-slate-800",
            "focus:ring-slate-400",
          ],
          variant === "danger" && [
            "text-white bg-red-500 hover:bg-red-600",
            "focus:ring-red-400",
            "shadow-[0_2px_8px_rgba(239,68,68,0.2)]",
            "active:scale-[0.98]",
          ],
          className
        )}
        style={
          variant === "primary"
            ? { background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }
            : undefined
        }
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
