import { ProductItem } from "@/hooks/useProductsData";
import { type ProductFormValues } from "@/hooks/api/use-products";
import { ProductType } from "@/types";

type InitialProductData = Partial<
  ProductItem & { image: string; taxName: string }
>;

type GetProductFormDefaultsArgs = {
  isEdit: boolean;
  initialData?: InitialProductData | null;
  outletId?: string | null;
  shouldProductType: `${ProductType}`;
};

export const parseDate = (
  date: string | Date | null | undefined,
): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  return new Date(date);
};

export const getProductFormDefaults = ({
  isEdit,
  initialData,
  outletId,
  shouldProductType,
}: GetProductFormDefaultsArgs): ProductFormValues => {
  if (isEdit && initialData) {
    const baseNormalized = {
      name: initialData.name ?? "",
      description: initialData.description ?? "",
      status: initialData.status ?? ("ACTIVE" as const),
      categoryId: initialData.categoryId ?? null,
      taxPercentage: initialData.taxPercentage ?? null,
      taxName: initialData.taxName ?? "",
      file: initialData.image,
    };

    if (initialData.type === "GOODS") {
      return {
        ...baseNormalized,
        type: "GOODS" as const,
        goods: {
          currentStock: initialData.goods?.currentStock ?? 0,
          unit: initialData.goods?.unit ?? "pcs",
          averageHpp: initialData.goods?.averageHpp ?? 0,
          sellingPrice: initialData.goods?.sellingPrice ?? 0,
          minStock: initialData.goods?.minStock ?? null,
          maxStock: initialData.goods?.maxStock ?? null,
          barcode: (initialData.goods as any)?.barcode ?? "",
          sku: (initialData.goods as any)?.sku ?? "",
        },
        service: undefined,
      } satisfies ProductFormValues;
    }

    if (initialData.type === "SERVICE") {
      return {
        ...baseNormalized,
        type: "SERVICE" as const,
        service: {
          durationMinutes: initialData.service?.durationMinutes ?? 30,
          sellingPrice: initialData.service?.sellingPrice ?? 0,
          providerName: initialData.service?.providerName ?? "",
          commissionType: initialData.service?.commissionType ?? "FIXED",
          commissionValue: initialData.service?.commissionValue ?? 0,
          providerEmail: initialData.service?.providerEmail ?? "",
          providerPhone: initialData.service?.providerPhone ?? "",
          bookingInWorkHours: initialData.service?.bookingInWorkHours ?? true,
          mondayOpen: parseDate(initialData.service?.mondayOpen),
          mondayClose: parseDate(initialData.service?.mondayClose),
          tuesdayOpen: parseDate(initialData.service?.tuesdayOpen),
          tuesdayClose: parseDate(initialData.service?.tuesdayClose),
          wednesdayOpen: parseDate(initialData.service?.wednesdayOpen),
          wednesdayClose: parseDate(initialData.service?.wednesdayClose),
          thursdayOpen: parseDate(initialData.service?.thursdayOpen),
          thursdayClose: parseDate(initialData.service?.thursdayClose),
          fridayOpen: parseDate(initialData.service?.fridayOpen),
          fridayClose: parseDate(initialData.service?.fridayClose),
          saturdayOpen: parseDate(initialData.service?.saturdayOpen),
          saturdayClose: parseDate(initialData.service?.saturdayClose),
          sundayOpen: parseDate(initialData.service?.sundayOpen),
          sundayClose: parseDate(initialData.service?.sundayClose),
        },
        goods: undefined,
        ticket: undefined,
      } satisfies ProductFormValues;
    }

    if (initialData.type === "TICKET") {
      return {
        ...baseNormalized,
        type: "TICKET" as const,
        ticket: {
          sellingPrice: initialData.ticket?.sellingPrice ?? 0,
          eventDate: parseDate(initialData.ticket?.eventDate) ?? new Date(),
          eventEndDate: parseDate(initialData.ticket?.eventEndDate),
          venue: initialData.ticket?.venue ?? "",
          venueAddress: initialData.ticket?.venueAddress ?? null,
          mapUrl: initialData.ticket?.mapUrl ?? null,
          totalQuota: initialData.ticket?.totalQuota ?? 100,
          maxPerOrder: initialData.ticket?.maxPerOrder ?? 5,
          saleStartDate: parseDate(initialData.ticket?.saleStartDate),
          saleEndDate: parseDate(initialData.ticket?.saleEndDate),
          terms: initialData.ticket?.terms ?? null,
          codeFormat: (initialData.ticket?.codeFormat as any) ?? "QR_CODE",
          designConfig: (initialData.ticket?.designConfig as any) ?? {
            primaryColor: "",
            backgroundColor: "",
            layoutType: "standard",
          },
        },
        goods: undefined,
        service: undefined,
      } satisfies ProductFormValues;
    }

    return baseNormalized as ProductFormValues;
  }

  return {
    type: shouldProductType,
    name: "",
    description: "",
    status: "ACTIVE",
    categoryId: null,
    taxPercentage: null,
    taxName: "",
    outletId: outletId!,
    goods: {
      currentStock: 0,
      unit: "pcs",
      averageHpp: 0,
      sellingPrice: 0,
      minStock: null,
      maxStock: null,
      barcode: "",
      sku: "",
    },
    service: { commissionType: "FIXED" } as any,
    file: undefined,
  } as unknown as ProductFormValues;
};
