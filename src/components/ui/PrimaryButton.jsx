import { LoaderCircle } from "lucide-react";

export function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  className = "",
  ...buttonProps
}) {
  const isDisabled = loading || disabled;

  return (
    <button
      disabled={isDisabled}
      className={[
        "flex h-12 w-full items-center justify-center gap-2 rounded-xl",
        "bg-[#432059] px-5 text-sm font-bold text-white",
        "shadow-[0_10px_25px_rgba(67,32,89,0.22)]",
        "transition duration-200",
        "hover:-translate-y-0.5 hover:bg-[#341366]",
        "focus:outline-none focus:ring-4 focus:ring-[#432059]/20",
        "disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0",
        className,
      ].join(" ")}
      {...buttonProps}
    >
      {loading && <LoaderCircle size={18} className="animate-spin" />}
      {children}
    </button>
  );
}