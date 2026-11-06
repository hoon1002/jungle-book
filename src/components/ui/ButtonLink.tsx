import Link from "next/link";
import type { ComponentProps } from "react";

const VARIANT = {
  // 주요 행동: 화면마다 하나만
  primary: "bg-torch text-night hover:bg-torch-deep",
  secondary: "border border-moss-bright text-bone hover:bg-canopy",
} as const;

export const buttonClass = (variant: keyof typeof VARIANT = "primary") =>
  `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-center font-bold transition-colors motion-reduce:transition-none sm:w-auto ${VARIANT[variant]}`;

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof VARIANT }) {
  return <Link {...props} className={`${buttonClass(variant)} ${className}`} />;
}
