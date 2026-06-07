"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  ReusableForm,
  type FormFieldConfig,
} from "@/components/ui/reuseable-form";
import { Button } from "@/components/ui/button";
import ServiceMediaUploader, { type MediaItem } from "./service-media-uploader";
import { productApi } from "@/lib/api";
import { type ProductItem } from "@/hooks/use-products-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem | null;
  onSaved?: () => void;
};

const mediaSchema = z.object({
  media: z
    .array(
      z.object({
        url: z.string().min(1, "URL media wajib diisi"),
        type: z.enum(["IMAGE", "VIDEO"]),
        source: z.enum(["UPLOAD", "EMBED"]),
        alt: z.string().optional(),
        order: z.number(),
        thumbnailUrl: z.string().optional(),
      }),
    )
    .max(5)
    .optional(),
});

type MediaFormValues = z.infer<typeof mediaSchema>;

const normalizeMedia = (items: ProductItem["media"]): MediaItem[] => {
  if (!items) return [];
  return items.map((item, index) => ({
    url: item.url,
    type: item.type,
    source: item.source,
    alt: item.alt,
    order: item.order ?? index,
    thumbnailUrl: item.thumbnailUrl,
  }));
};

export default function ProductMediaModal({
  open,
  onOpenChange,
  product,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const queuedRef = useRef<MediaItem[] | null>(null);
  const savingRef = useRef(false);
  const lastSavedRef = useRef<MediaItem[]>([]);
  const formRef = useRef<any>(null);

  const defaultValues = useMemo<MediaFormValues>(() => {
    return { media: normalizeMedia(product?.media) };
  }, [product?.id, product?.media]);

  const { mutateAsync: updateMedia } = useMutation({
    mutationFn: async (items: MediaItem[]) => {
      if (!product?.id) throw new Error("Produk belum dipilih");
      return productApi.update(product.id, {
        type: product.type,
        media: items,
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeMedia(product?.media);
    lastSavedRef.current = normalized;
    queuedRef.current = null;
    savingRef.current = false;
    setIsSaving(false);
  }, [open, product?.id, product?.media]);

  const persistMedia = useCallback(
    async (items: MediaItem[], options?: { silent?: boolean }) => {
      if (!product?.id) return;
      const serialized = JSON.stringify(items);
      const lastSerialized = JSON.stringify(lastSavedRef.current);
      if (serialized === lastSerialized) return;

      queuedRef.current = items;
      if (savingRef.current) return;
      savingRef.current = true;
      setIsSaving(true);

      while (queuedRef.current) {
        const nextItems = queuedRef.current;
        queuedRef.current = null;
        try {
          await updateMedia(nextItems);
          lastSavedRef.current = nextItems;
          queryClient.invalidateQueries({ queryKey: ["products"] });
          onSaved?.();
          if (!options?.silent) {
            toast.success("Media produk berhasil diperbarui");
          }
        } catch (error: any) {
          console.error("Error updating product media:", error);
          toast.error(
            error?.response?.data?.message || "Gagal memperbarui media",
          );
          formRef.current?.setValue("media", lastSavedRef.current, {
            shouldDirty: true,
          });
          queuedRef.current = null;
        }
      }

      savingRef.current = false;
      setIsSaving(false);
    },
    [onSaved, product?.id, queryClient, updateMedia],
  );

  if (!product) return null;

  const fields: FormFieldConfig<MediaFormValues>[] = [
    {
      name: "media",
      label: "",
      type: "custom",
      colSpan: "full",
      renderCustom: ({ values, form }) => {
        formRef.current = form;
        return (
          <ServiceMediaUploader
            value={values.media ?? []}
            onChange={(items) => {
              form.setValue("media", items, { shouldDirty: true });
              persistMedia(items, { silent: true });
            }}
            maxItems={5}
            onUploadingChange={setIsUploading}
          />
        );
      },
    },
  ];

  return (
    <ReusableForm
      withDialog
      schema={mediaSchema}
      defaultValues={defaultValues}
      fields={fields}
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      submitText="Simpan Media"
      loadingText="Menyimpan..."
      isLoading={isSaving || isUploading}
      dialogTitle={`Kelola Media - ${product.name}`}
      dialogDescription="Upload foto atau tambah link video untuk produk ini."
      onSubmit={(values) => persistMedia(values.media ?? [], { silent: false })}
      gridCols={1}
      renderFooter={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {isSaving || isUploading
              ? "Menyimpan perubahan..."
              : "Perubahan tersimpan otomatis"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isUploading}
              className="h-9 px-4 text-xs font-bold uppercase tracking-wider"
            >
              Tutup
            </Button>
          </div>
        </div>
      }
    />
  );
}
