import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "success" | "warning" | "danger" | "muted";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-k7-orange text-white hover:bg-k7-orangeDark shadow-sm hover:shadow-md",
  secondary: "border border-k7-orange text-k7-orange hover:bg-k7-orange hover:text-white",
  ghost: "text-k7-ink hover:text-k7-orange underline-offset-4 hover:underline",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-yellow-400 text-black hover:bg-yellow-500",
  danger: "bg-red-600 text-white hover:bg-red-700",
  muted: "bg-gray-200 text-k7-ink hover:bg-gray-300"
};

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-k7-line bg-white p-4 shadow-sm hover:shadow-card ${className}`}>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: "orange" | "gray" | "green" | "red" | "yellow" }) {
  const tones = {
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-800"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-k7-ink">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </Card>
  );
}

export function TrafficLight({ value }: { value: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-emerald-500",
    yellow: "bg-yellow-400",
    red: "bg-red-500"
  };
  return <span className={`inline-flex h-3 w-3 rounded-full ${colors[value]}`} />;
}
