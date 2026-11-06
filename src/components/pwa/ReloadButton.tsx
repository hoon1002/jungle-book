"use client";

import { Button } from "@/components/ui/ButtonLink";

export function ReloadButton({ children }: { children: React.ReactNode }) {
  return <Button onClick={() => window.location.reload()}>{children}</Button>;
}
