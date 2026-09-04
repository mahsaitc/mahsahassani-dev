'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/admin/ui';

/**
 * Confirmation gate for destructive actions. Uses a native <dialog> so focus
 * trapping, Escape, and the backdrop come from the platform rather than from
 * hand-rolled key handlers.
 */
export function useConfirm() {
  const [state, setState] = useState<{
    message: string;
    detail?: string;
    confirmLabel: string;
    resolve: (ok: boolean) => void;
  } | null>(null);

  const confirm = (message: string, options?: { detail?: string; confirmLabel?: string }) =>
    new Promise<boolean>((resolve) => {
      setState({
        message,
        detail: options?.detail,
        confirmLabel: options?.confirmLabel ?? 'Delete',
        resolve,
      });
    });

  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      detail={state.detail}
      confirmLabel={state.confirmLabel}
      onResolve={(ok) => {
        state.resolve(ok);
        setState(null);
      }}
    />
  ) : null;

  return { confirm, dialog };
}

function ConfirmDialog({
  message,
  detail,
  confirmLabel,
  onResolve,
}: {
  message: string;
  detail?: string;
  confirmLabel: string;
  onResolve: (ok: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      // Escape and backdrop dismissal both count as "no".
      onCancel={(e) => {
        e.preventDefault();
        onResolve(false);
      }}
      className="max-w-md rounded-lg border border-border bg-[#0d0d0f] p-0 text-foreground backdrop:bg-black/70"
    >
      <div className="p-5">
        <h2 className="text-sm font-medium">{message}</h2>
        {detail && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onResolve(false)} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onResolve(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
