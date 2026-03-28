import * as React from "react";
import { toast as sonnerToast } from "@shared/components/ui/sonner";
import { TOAST_ERROR_GENERIC } from "@shared/lib/toastMessages";

function nodeToText(node: React.ReactNode): string | undefined {
  if (node == null || node === false) return undefined;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    const parts = node.map(nodeToText).filter(Boolean);
    return parts.length ? parts.join(" ") : undefined;
  }
  if (React.isValidElement(node) && node.props && typeof (node.props as { children?: unknown }).children === "string") {
    return String((node.props as { children: string }).children);
  }
  return undefined;
}

export type LegacyToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
};

/**
 * Legacy adapter: maps Radix-style `{ title, description, variant }` to Sonner.
 * Prefer `import { toast } from "@shared/components/ui/sonner"` with toast.success / toast.error directly.
 */
function toast(props: LegacyToastInput) {
  const titleStr = nodeToText(props.title);
  const descStr = nodeToText(props.description);

  if (props.variant === "destructive") {
    const detail = descStr ?? titleStr;
    sonnerToast.error(TOAST_ERROR_GENERIC, detail ? { description: detail } : undefined);
  } else {
    sonnerToast.success(titleStr || "تم بنجاح", descStr ? { description: descStr } : undefined);
  }
  return {
    id: "sonner",
    dismiss: () => sonnerToast.dismiss(),
    update: () => {},
  };
}

function useToast() {
  return {
    toasts: [] as { id: string; title?: React.ReactNode; description?: React.ReactNode; variant?: "default" | "destructive" }[],
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
