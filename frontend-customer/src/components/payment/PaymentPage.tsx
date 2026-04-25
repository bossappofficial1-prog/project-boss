"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Phone, Receipt, AlertCircle, CheckCircle, Store, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { CheckoutData, PaymentMethod } from "@/types/checkout";
import { CheckoutService } from "@/services/checkout";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useTranslations } from "@/hooks/useI18n";
import { ManualPaymentResponse, PaymentMethodId } from "@/types";
import { ImageRender } from "../shared/Image";
import { Alert } from "../Base";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useFeatureGuide } from "@/hooks/useFeatureGuide";
import { GuideStep } from "@/providers/FeatureGuideProvider";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentPageProps {
  checkoutData: CheckoutData;
  selectedPaymentMethod: PaymentMethod;
}

interface CustomerInfo {
  name: string;
  phone: string;
}

// Customer Info Form Component
const CustomerInfoForm: React.FC<{
  customerInfo: CustomerInfo;
  onInfoChange: (info: CustomerInfo) => void;
  errors: Record<string, string>;
  guideTarget?: string;
}> = ({ customerInfo, onInfoChange, errors, guideTarget }) => {
  const t = useTranslations("paymentPage");

  return (
    <Card data-guide-target={guideTarget}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="w-5 h-5 text-primary" />
          {t("customerInfo.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground sm:text-sm">
            {t("customerInfo.fullName")}
          </label>
          <Input
            placeholder={t("customerInfo.fullNamePlaceholder")}
            value={customerInfo.name}
            onChange={(e) => onInfoChange({ ...customerInfo, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500 sm:text-sm">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground sm:text-sm">
            {t("customerInfo.phoneNumber")}
          </label>
          <Input
            placeholder={t("customerInfo.phonePlaceholder")}
            value={customerInfo.phone}
            onChange={(e) => onInfoChange({ ...customerInfo, phone: e.target.value })}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500 sm:text-sm">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-blue-200/60 bg-blue-50/80 p-3 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-100/80">
          <p className="flex items-start text-xs leading-relaxed sm:text-sm">
            <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-300" />
            <span>{t("customerInfo.infoMessage")}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Order Summary Component for Payment
const PaymentOrderSummary: React.FC<{ checkoutData: CheckoutData; guideTarget?: string }> = ({ checkoutData, guideTarget }) => {
  const t = useTranslations("paymentPage");

  return (
    <Card data-guide-target={guideTarget}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Receipt className="w-5 h-5 text-primary" />
          {t("orderSummary.title")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {checkoutData.outlets.map((outlet, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-medium sm:text-sm">{outlet.outletName}</span>
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("orderSummary.subtotal")}</span>
                <span>{formatCurrency(outlet.subtotal)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Total Summary */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span>{t("orderSummary.totalOrder")}</span>
            <span>{formatCurrency(checkoutData.subtotal)}</span>
          </div>

          <div className="flex justify-between border-t pt-2 text-base font-semibold sm:text-lg">
            <span>{t("orderSummary.totalPayment")}</span>
            <span className="text-primary">{formatCurrency(checkoutData.grandTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Payment Method Display Component
const PaymentMethodDisplay: React.FC<{ method: PaymentMethod; guideTarget?: string }> = ({ method, guideTarget }) => {
  const t = useTranslations("paymentPage");

  return (
    <Card data-guide-target={guideTarget}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CreditCard className="w-5 h-5 text-primary" />
          {t("paymentMethod.title")}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
          <div className="w-10 h-10 overflow-hidden rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">
            <ImageRender alt={method.name} src={(method as any).image_url} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium sm:text-sm">{method.name}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{method.description}</p>
          </div>
          <Badge variant="secondary" className="h-6 text-[11px] sm:text-xs">
            {method.type === "qris"
              ? t("paymentMethod.types.qris")
              : method.type === "va"
                ? t("paymentMethod.types.va")
                : t("paymentMethod.types.card")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Payment Button Component
const PaymentButton: React.FC<{
  onPay: () => void;
  amount: number;
  isLoading: boolean;
  guideTarget?: string;
}> = ({ onPay, amount, isLoading, guideTarget }) => {
  const t = useTranslations("paymentPage");

  return (
    <Card className="sticky bottom-0 py-0 border-t shadow-lg" data-guide-target={guideTarget}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground sm:text-sm">{t("paymentButton.totalPayment")}</p>
            <p className="text-lg font-bold text-primary sm:text-xl">{formatCurrency(amount)}</p>
          </div>
          <Button
            size="lg"
            className="h-11 w-full px-8 text-[13px] sm:h-12 sm:w-auto sm:text-sm"
            onClick={onPay}
            disabled={isLoading}>
            {isLoading ? t("paymentButton.processing") : t("paymentButton.payNow")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Payment Page Component
const PaymentPage: React.FC<PaymentPageProps> = ({ checkoutData, selectedPaymentMethod }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient()
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [hasStartedPayment, setHasStartedPayment] = useState(false);
  const router = useRouter();
  const { items: cartItems, clearOutletItems } = useCart();
  const t = useTranslations("paymentPage");
  const snackbar = useSnackbar();

  const paymentGuideSteps = React.useMemo<GuideStep[]>(() => [
    {
      id: "payment-customer-info",
      title: "Lengkapi data pemesan",
      description: "Isi nama dan nomor telepon aktif agar tim outlet mudah menghubungi kamu.",
      target: '[data-guide-target="payment-customer-info"]',
      placement: "bottom",
      focusPadding: 18,
    },
    {
      id: "payment-method",
      title: "Cek metode pembayaran",
      description: "Pastikan metode pembayaran yang dipilih sudah sesuai sebelum melanjutkan.",
      target: '[data-guide-target="payment-method-display"]',
      placement: "bottom",
      focusPadding: 18,
    },
    {
      id: "payment-summary",
      title: "Review total pembayaran",
      description: "Periksa ringkasan total untuk memastikan nominal transaksi sudah benar.",
      target: '[data-guide-target="payment-order-summary"]',
      placement: "top",
      focusPadding: 18,
    },
    {
      id: "payment-pay-now",
      title: "Bayar sekarang",
      description: "Tekan tombol ini untuk membuat order dan masuk ke proses pembayaran.",
      target: '[data-guide-target="payment-pay-now"]',
      placement: "top",
      focusPadding: 16,
    },
  ], []);

  useFeatureGuide({
    id: "payment-page-guide",
    steps: paymentGuideSteps,
    autoStart: true,
    runOnceKey: "guide:payment-page",
    delay: 900,
    enabled: Boolean(checkoutData?.outlets?.length),
  });

  // Load customer info from ProfileSettings (if available)
  useEffect(() => {
    // Try to get customer info from localStorage or other sources
    const savedProfile = localStorage.getItem("user_preferences");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setCustomerInfo({
          name: profile.fullName || "",
          phone: profile.phone || "",
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    }
  }, []);

  // Prevent accidental page leave during payment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStartedPayment && !isLoading) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasStartedPayment, isLoading]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = t("validation.nameRequired");
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = t("validation.phoneRequired");
    } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(customerInfo.phone.replace(/\s/g, ""))) {
      newErrors.phone = t("validation.phoneInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async (retryCount = 0) => {
    if (!validateForm()) {
      return;
    }

    setHasStartedPayment(true);
    setPaymentError(null);
    setIsLoading(true);

    const maxRetries = 2;

    try {
      // Construct payload for backend API sesuai format yang benar
      let itemDetails: Array<{ productId: string; quantity: number }> = [];
      let selectedSlotId: string | undefined;
      let staffId: string | undefined;
      let outletId: string = "";

      // Try to get items from checkoutData first
      const checkoutItems = checkoutData.outlets.flatMap((outlet) => {
        if (!outlet.items || !Array.isArray(outlet.items)) {
          return [];
        }

        // Set outletId dari outlet pertama (karena checkout hanya 1 outlet)
        if (!outletId) {
          outletId = outlet.items[0]?.outletId || "";
        }

        return outlet.items.map((item) => {
          if (item.type === "SERVICE" && item.selectedSlot && !selectedSlotId) {
            selectedSlotId = item.selectedSlot;
            if (item.staffId) {
              staffId = item.staffId;
            }
          }

          // Return item dengan format yang benar
          return {
            productId: item.productId,
            quantity: item.quantity,
          };
        });
      });

      if (checkoutItems.length > 0) {
        itemDetails = checkoutItems;
      } else {
        // Fallback to cart items if checkoutData doesn't have items
        console.warn("Using cart items as fallback for payment payload");
        const fallbackItems = cartItems.map((item) => {
          // Set outletId dari cart item pertama
          if (!outletId) {
            outletId = item.outletId;
          }

          // Untuk service products, ambil selectedSlotId
          if (item.type === "SERVICE" && item.selectedSlot && !selectedSlotId) {
            selectedSlotId = item.selectedSlot;
            if (item.staffId) {
              staffId = item.staffId;
            }
          }

          return {
            productId: item.productId,
            quantity: item.quantity,
          };
        });
        itemDetails = fallbackItems;
      }

      // Construct payload sesuai format backend yang benar
      const payloadBody = {
        outletId: outletId,
        guestCustomer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
        },
        items: itemDetails,
        paymentMethod: "online" as const, // Always online for customer app
        onlinePaymentChannel: selectedPaymentMethod.id as PaymentMethodId, // Map payment method to channel
        ...(selectedSlotId && { bookingSlotId: selectedSlotId }),
        ...(staffId && { staffId }),
        ...(useCart.getState().tableId && { tableId: useCart.getState().tableId }),
      };

      // Check if we have any items
      if (itemDetails.length === 0) {
        throw new Error(t("errors.noItems"));
      }

      // Send to backend API
      const response = await CheckoutService.processPayment(payloadBody as any);

      const orderId = response.order_id;

      const isManualResponse = (resp: any): resp is ManualPaymentResponse => {
        return Boolean(resp?.manual && resp.manual?.instructions && resp.manual?.fee_summary);
      };

      // Save payment info for local reference
      const basePaymentInfo = {
        checkoutData,
        selectedPaymentMethod,
        customerInfo,
        paymentDate: new Date().toISOString(),
        status: "pending",
        payload: payloadBody,
      };

      if (isManualResponse(response)) {
        CheckoutService.clearManualPaymentFromStorage();
        CheckoutService.saveManualPaymentToStorage({
          response,
          checkoutData,
          selectedPaymentMethod,
          customerInfo,
          createdAt: new Date().toISOString(),
        });
      } else {
        CheckoutService.clearManualPaymentFromStorage();
        localStorage.setItem("lastPayment", JSON.stringify(basePaymentInfo));
        localStorage.setItem("paymentInfo", JSON.stringify(response));
      }

      // Clear checkout and payment data
      CheckoutService.clearCheckoutDataFromStorage();
      CheckoutService.clearPaymentDataFromStorage();
      clearOutletItems(outletId);

      queryClient.invalidateQueries({ queryKey: ['orders'] })

      router.push(`/payment/${orderId}`);
    } catch (error) {
      // Check if it's a network error and should retry
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("timeout") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("ERR_NETWORK"));

      if (isNetworkError && retryCount < maxRetries) {
        console.log(`Retrying payment... Attempt ${retryCount + 1} of ${maxRetries}`);
        setIsLoading(false);
        snackbar.error(`Koneksi terputus. Mencoba ulang (${retryCount + 1}/${maxRetries})...`);

        // Retry after delay with exponential backoff
        setTimeout(
          () => {
            handlePayment(retryCount + 1);
          },
          1500 * (retryCount + 1),
        ); // 1.5s, 3s
        return;
      }

      const errorMessage = (error as any).response.data.message;
      snackbar.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-[13px] font-medium sm:text-sm">{t("title")}</p>
            <div className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
              <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">{t("stepper.summary")}</div>
              <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">{t("stepper.checkout")}</div>
              <div className="rounded-md border bg-primary/10 px-2 py-1.5 text-center font-semibold text-primary">{t("stepper.payment")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info Form */}
      <CustomerInfoForm
        customerInfo={customerInfo}
        onInfoChange={setCustomerInfo}
        errors={errors}
        guideTarget="payment-customer-info"
      />

      {/* Payment Method Display */}
      <PaymentMethodDisplay method={selectedPaymentMethod} guideTarget="payment-method-display" />

      {/* Order Summary */}
      <PaymentOrderSummary checkoutData={checkoutData} guideTarget="payment-order-summary" />

      {/* Payment Button */}
      <PaymentButton
        onPay={handlePayment}
        amount={checkoutData.grandTotal}
        isLoading={isLoading}
        guideTarget="payment-pay-now"
      />

      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaveDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("leaveDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              {t("leaveDialog.continue")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setHasStartedPayment(false);
                router.back();
              }}>
              {t("leaveDialog.leave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPage;
