"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type ConfirmHandlerResult = void | boolean | Promise<void | boolean>;

type AlignOption = "left" | "center";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  confirmVariant?: ButtonVariant;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  confirmLoadingLabel?: React.ReactNode;
  onConfirm?: (inputValue?: string) => ConfirmHandlerResult;
  preventCloseOnConfirm?: boolean;
  cancelLabel?: React.ReactNode;
  cancelVariant?: ButtonVariant;
  hideCancel?: boolean;
  onCancel?: () => void;
  showCloseButton?: boolean;
  align?: AlignOption;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputRequired?: boolean;
};

function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === "function";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  icon,
  footer,
  confirmLabel = "Konfirmasi",
  confirmVariant = "default",
  confirmDisabled,
  confirmLoading,
  confirmLoadingLabel = "Memproses...",
  onConfirm,
  preventCloseOnConfirm,
  cancelLabel = "Batal",
  cancelVariant = "outline",
  hideCancel,
  onCancel,
  showCloseButton = true,
  align = "center",
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  showInput,
  inputPlaceholder,
  inputRequired,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const cancelTriggeredRef = React.useRef(false);
  const usingExternalLoading = typeof confirmLoading === "boolean";
  const isLoading = usingExternalLoading ? Boolean(confirmLoading) : internalLoading;

  React.useEffect(() => {
    if (!open) {
      if (internalLoading) {
        setInternalLoading(false);
      }
      setInputValue("");
    }
  }, [open, internalLoading]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && open && !cancelTriggeredRef.current) {
        onCancel?.();
      }
      if (!nextOpen) {
        cancelTriggeredRef.current = false;
        if (!usingExternalLoading) {
          setInternalLoading(false);
        }
      }
      onOpenChange(nextOpen);
    },
    [onCancel, onOpenChange, open, usingExternalLoading],
  );

  const handleCancel = React.useCallback(() => {
    if (isLoading) return;
    cancelTriggeredRef.current = true;
    onCancel?.();
    onOpenChange(false);
  }, [isLoading, onCancel, onOpenChange]);

  const settleShouldClose = (
    explicitClose: boolean | undefined,
    preventClose: boolean | undefined,
  ) => {
    if (explicitClose === true) return true;
    if (explicitClose === false) return false;
    return !preventClose;
  };

  const handleConfirm = React.useCallback(async () => {
    if (isLoading) return;

    if (!onConfirm) {
      if (!preventCloseOnConfirm) {
        onOpenChange(false);
      }
      return;
    }

    let explicitClose: boolean | undefined;

    try {
      const result = showInput ? onConfirm(inputValue) : onConfirm();
      if (isPromise(result)) {
        if (!usingExternalLoading) {
          setInternalLoading(true);
        }
        const resolved = await result;
        if (typeof resolved === "boolean") {
          explicitClose = resolved;
        }
      } else if (typeof result === "boolean") {
        explicitClose = result;
      }
    } catch (error) {
      console.error("ConfirmDialog onConfirm error", error);
      explicitClose = false;
    } finally {
      if (!usingExternalLoading) {
        setInternalLoading(false);
      }
    }

    const shouldClose = settleShouldClose(explicitClose, preventCloseOnConfirm);
    if (shouldClose) {
      onOpenChange(false);
    }
  }, [
    isLoading,
    onConfirm,
    preventCloseOnConfirm,
    onOpenChange,
    usingExternalLoading,
    inputValue,
    showInput,
  ]);

  const alignmentClass = align === "left" ? "text-left" : "text-center";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn("md:max-w-sm", contentClassName)}>
        <DialogHeader
          className={cn(
            "flex flex-col gap-2",
            alignmentClass,
            align === "center" ? "sm:text-center" : "sm:text-left",
            headerClassName,
          )}>
          {icon && (
            <div
              className={cn(
                "mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary",
                align === "left" && "mx-0",
              )}>
              {icon}
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="leading-relaxed">{description}</DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className={cn("text-sm text-muted-foreground", bodyClassName)}>{children}</div>
        )}

        {showInput && (
          <div className={cn("text-sm text-muted-foreground mt-4", bodyClassName)}>
            <Textarea
              placeholder={inputPlaceholder}
              className="min-h-[100px]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        )}

        {footer ?? (
          <DialogFooter
            className={cn(
              "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
              footerClassName,
            )}>
            {!hideCancel && (
              <Button
                type="button"
                variant={cancelVariant}
                onClick={handleCancel}
                disabled={isLoading || confirmDisabled}>
                {cancelLabel}
              </Button>
            )}
            <Button
              type="button"
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={
                isLoading || confirmDisabled || (showInput && inputRequired && !inputValue.trim())
              }>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"></span>
                  {confirmLoadingLabel}
                </span>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { ConfirmDialogProps };
