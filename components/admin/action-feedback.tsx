"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type FeedbackType = "success" | "error" | "loading";

type FeedbackState = {
  id: number;
  message: string;
  type: FeedbackType;
};

export type AdminActionRunner = (
  actionId: string,
  action: () => void,
  successMessage: string,
  errorMessage?: string,
) => void;

export function useAdminActionFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (clearTimerRef.current) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (message: string, type: FeedbackType = "success", duration = 2600) => {
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }

      setFeedback({
        id: Date.now(),
        message,
        type,
      });

      if (type !== "loading") {
        clearTimerRef.current = window.setTimeout(() => {
          setFeedback(null);
          clearTimerRef.current = null;
        }, duration);
      }
    },
    [],
  );

  const runAction = useCallback<AdminActionRunner>(
    (
      actionId,
      action,
      successMessage,
      errorMessage = "Action could not be completed.",
    ) => {
      if (pendingTimerRef.current) {
        window.clearTimeout(pendingTimerRef.current);
      }

      setPendingAction(actionId);
      showFeedback("Saving changes...", "loading");

      try {
        action();
        pendingTimerRef.current = window.setTimeout(() => {
          setPendingAction((currentAction) =>
            currentAction === actionId ? null : currentAction,
          );
          showFeedback(successMessage, "success");
          pendingTimerRef.current = null;
        }, 180);
      } catch {
        setPendingAction(null);
        showFeedback(errorMessage, "error", 4200);
      }
    },
    [showFeedback],
  );

  useEffect(() => clearTimers, [clearTimers]);

  return {
    feedback,
    pendingAction,
    runAction,
    showFeedback,
    isPending: (actionId: string) => pendingAction === actionId,
  };
}

export function AdminActionFeedback({
  feedback,
}: {
  feedback: FeedbackState | null;
}) {
  if (!feedback) {
    return null;
  }

  const Icon =
    feedback.type === "loading"
      ? Loader2
      : feedback.type === "error"
        ? AlertCircle
        : CheckCircle2;

  return (
    <div
      role={feedback.type === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-xl",
        feedback.type === "error"
          ? "border-primary/40 text-primary"
          : "border-border text-foreground",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          feedback.type === "loading" && "animate-spin",
          feedback.type === "success" && "text-primary",
        )}
      />
      <span className="font-semibold leading-5">{feedback.message}</span>
    </div>
  );
}
