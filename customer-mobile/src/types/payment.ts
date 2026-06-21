export type PaymentMethodId =
  | "qris"
  | "bca-va"
  | "bni-va"
  | "bri-va"
  | "mandiri-va"
  | "permata-va"
  | "manual-qris"
  | "manual-transfer";

export type PaymentMethodType = "qris" | "va" | "manual";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  type: PaymentMethodType;
  description: string;
  image_url: string;
  flow?: "midtrans" | "manual";
  manualType?: "QRIS_OFFLINE" | "OWNER_TRANSFER";
  disable: boolean;
}
