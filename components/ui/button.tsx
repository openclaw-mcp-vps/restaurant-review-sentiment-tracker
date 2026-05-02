import type { ReactNode } from "react";

type ButtonVariant = "default" | "outline";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
};

const classesByVariant: Record<ButtonVariant, string> = {
  default: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
  outline: "border border-slate-600 text-slate-200 hover:border-slate-400",
};

export function Button({
  children,
  className = "",
  href,
  type = "button",
  variant = "default",
  disabled,
  onClick,
}: ButtonProps) {
  const classNames = `inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${classesByVariant[variant]} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classNames}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classNames} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
