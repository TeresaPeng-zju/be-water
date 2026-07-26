"use client";

import {useEffect, useRef} from "react";
import {BrandSignature} from "@/components/brand/brand-signature";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({open, title, description, cancelLabel, confirmLabel, onCancel, onConfirm}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
        if (dialog.open) dialog.close();
      };
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="bewater-confirm"
      aria-labelledby="bewater-confirm-title"
      aria-describedby="bewater-confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="bewater-confirm-card">
        <BrandSignature size={30} className="bewater-confirm-brand"/>
        <h2 id="bewater-confirm-title">{title}</h2>
        <p id="bewater-confirm-description">{description}</p>
        <div className="bewater-confirm-actions">
          <button type="button" className="bewater-confirm-cancel" onClick={onCancel} autoFocus>{cancelLabel}</button>
          <button type="button" className="bewater-confirm-delete" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}
