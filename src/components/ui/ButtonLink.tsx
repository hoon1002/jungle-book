import Link from "next/link";
import type { ComponentProps } from "react";

const VARIANT = {
  // 주요 행동: 화면마다 하나만
  primary: "bg-torch text-night not-aria-disabled:hover:bg-torch-deep",
  secondary: "border border-moss-bright text-bone not-aria-disabled:hover:bg-canopy",
} as const;

type Variant = keyof typeof VARIANT;

// aria-disabled 인 버튼은 흐리게, 눌러도 반응하지 않는 모양으로 (초점은 받아서 이유를 읽을 수 있게)
export const buttonClass = (variant: Variant = "primary") =>
  `inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-center font-bold transition-colors motion-reduce:transition-none sm:w-auto aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${VARIANT[variant]}`;

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${buttonClass(variant)} ${className}`} />;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type={type} {...props} className={`${buttonClass(variant)} ${className}`} />;
}
