"use client";

import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, ReceiptText, Package, AlertCircle,
  Loader2, Clock, ScanBarcode,
} from "lucide-react";
import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePosV2Products, usePosV2CashSummary, usePosV2RecentOrders,
  usePosV2OpenOrders, usePosV2CreateOrder, usePosV2OutletQris,
} from "@/hooks/api/use-pos-v2";
import { useProductBarcodeLookup } from "@/hooks/api/use-product-barcode";
import { useLoyaltyConfig } from "@/hooks/api/use-loyalty";
import type { PosV2Product, PosV2OrderResult, PosV2OpenOrder } from "@/lib/apis/pos-v2";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel, type CartLine } from "./CartPanel";
import { CustomerInfo } from "./CustomerInfo";
import { PaymentSection, type PaymentMethodType } from "./PaymentSection";
import { CashSummaryBar } from "./CashSummaryBar";
import { OrderSuccessDialog } from "./OrderSuccessDialog";
import { RecentOrders } from "./RecentOrders";
import { OpenOrders } from "./OpenOrders";
import { ServiceScheduleDialog, type ScheduleSelection } from "./ServiceScheduleDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CashierShiftGate } from "@/components/cashier/shift/CashierShiftGate";
import { beepSuccess, beepError } from "@/lib/beep";

type LeftTab = "catalog" | "open" | "recent";
type MobileView = "catalog" | "cart";

interface ScheduleDialogState {
  product: PosV2Product;
  selection: ScheduleSelection | null;
}

export function PosV2Content() {
  const { cashierData, outletData } = useCashierContext();
  const outletId = outletData?.id as string;
  const queryClient = useQueryClient();

  const [leftTab, setLeftTab] = React.useState<LeftTab>("catalog");
  const [mobileView, setMobileView] = React.useState<MobileView>("catalog");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [cart, setCart] = React.useState<Record<string, CartLine>>({});
  const [isWalkIn, setIsWalkIn] = React.useState(false);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodType>("cash");
  const [cashReceived, setCashReceived] = React.useState(0);
  const [orderResult, setOrderResult] = React.useState<PosV2OrderResult | null>(null);
  const [orderPrintContext, setOrderPrintContext] = React.useState<{ items: any[]; cashierName: string; outletName: string } | null>(null);
  const [showPayConfirm, setShowPayConfirm] = React.useState(false);
  const [scheduleDialog, setScheduleDialog] = React.useState<ScheduleDialogState | null>(null);
  const [pendingOpenOrder, setPendingOpenOrder] = React.useState<PosV2OpenOrder | null>(null);
  const [member, setMember] = React.useState<any>(null);
  const [pointsRedeemed, setPointsRedeemed] = React.useState(0);
  const [tableNumber, setTableNumber] = React.useState("");
  const [tableId, setTableId] = React.useState("");
  const [resumedOrderId, setResumedOrderId] = React.useState<string | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = React.useState<PosV2Product | null>(null);
  const lastScannedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const retailBarcodeRef = React.useRef<HTMLInputElement>(null);
  const [retailBarcodeBuffer, setRetailBarcodeBuffer] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    if (outletData?.type === "RETAIL") setIsWalkIn(true);
  }, [outletData?.type]);

  React.useEffect(() => {
    if (isRetail && retailBarcodeRef.current) retailBarcodeRef.current.focus();
  }, []);

  const { data: productsData, isLoading: productsLoading } = usePosV2Products(outletId, debouncedSearch || undefined);
  const products = productsData?.products || [];
  const { data: cashSummary, isLoading: summaryLoading } = usePosV2CashSummary(outletId);
  const { data: openOrders = [], isLoading: openLoading } = usePosV2OpenOrders(outletId);
  const { data: recentOrders = [], isLoading: recentLoading } = usePosV2RecentOrders(outletId);
  const { data: outletQris, isLoading: qrisLoading } = usePosV2OutletQris(outletId);
  const { data: loyaltyConfig } = useLoyaltyConfig(outletId);
  const createOrder = usePosV2CreateOrder();
  const barcodeLookup = useProductBarcodeLookup();

  const isRetail = outletData?.type === "RETAIL";
  const isFnbOrCustom = outletData?.type === "FNB" || outletData?.type === "CUSTOM";

  const cartItems = React.useMemo(() => Object.values(cart), [cart]);
  const subtotal = React.useMemo(() => cartItems.reduce((s, l) => s + l.product.price * l.quantity, 0), [cartItems]);
  const taxAmount = React.useMemo(() => cartItems.reduce((s, l) => s + l.product.price * l.quantity * ((l.product.taxPercentage ?? 0) / 100), 0), [cartItems]);
  const loyaltyDiscount = React.useMemo(() => {
    const cfg = loyaltyConfig as any;
    if (!cfg?.isActive || !cfg?.pointValue) return 0;
    return pointsRedeemed * cfg.pointValue;
  }, [pointsRedeemed, loyaltyConfig]);
  const grandTotal = React.useMemo(() => Math.max(0, subtotal + taxAmount - loyaltyDiscount), [subtotal, taxAmount, loyaltyDiscount]);
  const cartQuantities = React.useMemo(() => Object.fromEntries(Object.entries(cart).map(([id, l]) => [id, l.quantity])), [cart]);
  const totalCartItems = React.useMemo(() => cartItems.reduce((s, l) => s + l.quantity, 0), [cartItems]);
  const hasUnscheduledService = React.useMemo(() => cartItems.some((l) => l.product.type === "SERVICE" && (!l.bookingSlotId || !l.bookingStart || !l.staffId)), [cartItems]);
  const canSubmit = React.useMemo(() => {
    if (!cartItems.length) return false;
    if (!isWalkIn && (!customerName.trim() || !customerPhone.trim())) return false;
    if (paymentMethod === "cash" && cashReceived < grandTotal) return false;
    if (paymentMethod === "qris" && !outletQris?.qrisImageUrl) return false;
    if (hasUnscheduledService) return false;
    return true;
  }, [cartItems.length, isWalkIn, customerName, customerPhone, paymentMethod, cashReceived, grandTotal, hasUnscheduledService, outletQris]);

  React.useEffect(() => {
    if (!isRetail) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "F1": e.preventDefault(); retailBarcodeRef.current?.focus(); break;
        case "F2": e.preventDefault(); setIsWalkIn((p) => !p); toast.info(isWalkIn ? "Mode: Input Pelanggan" : "Mode: Walk-in"); break;
        case "F8": e.preventDefault(); if (canSubmit) setShowPayConfirm(true); break;
        case "Escape":
          e.preventDefault();
          if (cartItems.length > 0) { handleClearCart(); toast.info("Keranjang dikosongkan"); }
          retailBarcodeRef.current?.focus();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRetail, canSubmit, cartItems.length, isWalkIn]);

  const handleAddToCart = (product: PosV2Product) => {
    if (product.type === "SERVICE") {
      const existingService = cartItems.find((l) => l.product.type === "SERVICE" && l.product.id !== product.id);
      if (existingService) { toast.error("Hanya satu layanan per transaksi"); return; }
      const existing = cart[product.id];
      setScheduleDialog({ product, selection: existing?.bookingSlotId && existing.bookingStart && existing.bookingEnd && existing.staffId ? { slotId: existing.bookingSlotId, startTimeIso: existing.bookingStart, endTimeIso: existing.bookingEnd, staffId: existing.staffId } : null });
      return;
    }
    setCart((prev) => {
      const current = prev[product.id]?.quantity ?? 0;
      if (product.type === "GOODS" && (product.stock ?? 0) > 0 && current + 1 > (product.stock ?? 0)) { toast.error(`Stok "${product.name}" tidak cukup`); return prev; }
      if (product.type === "TICKET") {
        const available = (product.totalQuota ?? 0) - (product.soldCount ?? 0);
        if (available > 0 && current + 1 > available) { toast.error(`Kuota tiket "${product.name}" tidak cukup`); return prev; }
      }
      return { ...prev, [product.id]: { product, quantity: current + 1 } };
    });
  };

  const handleScanBarcode = (code: string) => {
    const barcode = code.trim();
    if (!barcode) return;
    barcodeLookup.mutate({ code: barcode, outletId }, {
      onSuccess: (product) => {
        handleAddToCart(product);
        if (isRetail) {
          beepSuccess();
          setLastScannedProduct(product);
          if (lastScannedTimerRef.current) clearTimeout(lastScannedTimerRef.current);
          lastScannedTimerRef.current = setTimeout(() => setLastScannedProduct(null), 3000);
        }
      },
      onError: (error: any) => {
        if (isRetail) beepError();
        toast.error(error?.response?.data?.message || error?.message || "Barcode tidak ditemukan");
      },
    });
  };

  const handleRetailBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = retailBarcodeBuffer.trim();
      if (code) { handleScanBarcode(code); setRetailBarcodeBuffer(""); }
    }
  };

  const handleIncrease = (productId: string) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line || line.product.type === "SERVICE") return prev;
      if (line.product.type === "GOODS" && (line.product.stock ?? 0) > 0 && line.quantity + 1 > (line.product.stock ?? 0)) { toast.error(`Stok "${line.product.name}" tidak cukup`); return prev; }
      if (line.product.type === "TICKET") {
        const available = (line.product.totalQuota ?? 0) - (line.product.soldCount ?? 0);
        if (available > 0 && line.quantity + 1 > available) { toast.error(`Kuota tiket "${line.product.name}" tidak cukup`); return prev; }
      }
      return { ...prev, [productId]: { ...line, quantity: line.quantity + 1 } };
    });
  };

  const handleDecrease = (productId: string) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      if (line.quantity <= 1) { const { [productId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productId]: { ...line, quantity: line.quantity - 1 } };
    });
  };

  const handleRemove = (productId: string) => setCart((prev) => { const { [productId]: _, ...rest } = prev; return rest; });
  const handleClearCart = () => setCart({});

  const handleScheduleService = (productId: string) => {
    const line = cart[productId];
    if (!line) return;
    setScheduleDialog({ product: line.product, selection: line.bookingSlotId && line.bookingStart && line.bookingEnd && line.staffId ? { slotId: line.bookingSlotId, startTimeIso: line.bookingStart, endTimeIso: line.bookingEnd, staffId: line.staffId } : null });
  };

  const handleScheduleConfirm = (selection: ScheduleSelection) => {
    const product = scheduleDialog?.product;
    if (!product) return;
    setCart((prev) => ({ ...prev, [product.id]: { product, quantity: 1, bookingSlotId: selection.slotId, bookingStart: selection.startTimeIso, bookingEnd: selection.endTimeIso, staffId: selection.staffId } }));
    setScheduleDialog(null);
    toast.success("Jadwal layanan tersimpan");
  };

  const applyOpenOrder = (order: PosV2OpenOrder) => {
    const newCart: Record<string, CartLine> = {};
    order.items.forEach((item) => { newCart[item.productId] = { product: item.product as any, quantity: item.quantity }; });
    setCart(newCart);
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);
    setIsWalkIn(order.customerName === "Walk-in");
    setTableNumber(order.tableNumber || "");
    setTableId(order.tableId || "");
    setResumedOrderId(order.id);
    setPendingOpenOrder(null);
    setLeftTab("catalog");
    toast.success(`Melanjutkan pesanan: ${order.customerName}`);
  };

  const handleSelectOpenOrder = (order: PosV2OpenOrder) => {
    if (cartItems.length > 0) { setPendingOpenOrder(order); return; }
    applyOpenOrder(order);
  };

  const resetForm = () => {
    setCart({});
    setCustomerName("");
    setCustomerPhone("");
    setCashReceived(0);
    setIsWalkIn(isRetail);
    setPointsRedeemed(0);
    setMember(null);
    setTableNumber("");
    setTableId("");
    setResumedOrderId(null);
    if (isRetail) setTimeout(() => retailBarcodeRef.current?.focus(), 100);
  };

  React.useEffect(() => { setPointsRedeemed(0); }, [member, isWalkIn]);

  const handleSubmitOrder = (isSaved: boolean = false) => {
    if (!canSubmit && !isSaved) return;
    if (isSaved && !cartItems.length) return;
    const customer = isWalkIn ? { name: "Walk-in", phone: "0000000000" } : { name: customerName.trim(), phone: customerPhone.trim() };
    const serviceItem = cartItems.find((l) => l.product.type === "SERVICE");
    createOrder.mutate({
      customer, outletId,
      items: cartItems.map((line) => ({ productId: line.product.id, quantity: line.product.type === "SERVICE" ? 1 : line.quantity })),
      paymentMethod: isSaved ? "none" : paymentMethod,
      cashReceived: isSaved ? 0 : cashReceived,
      pointsRedeemed,
      staffId: serviceItem?.staffId || (cashierData as any)?.id,
      ...(serviceItem?.bookingSlotId && { bookingSlotId: serviceItem.bookingSlotId, bookingDate: serviceItem.bookingStart }),
      tableId: tableId || undefined,
      tableNumber: isFnbOrCustom ? tableNumber : undefined,
      isOpenBill: isSaved,
      existingOrderId: resumedOrderId || undefined,
    }, {
      onSuccess: (result) => {
        setOrderPrintContext({ items: cartItems.map((l) => ({ name: l.product.name, price: l.product.price, qty: l.quantity })), cashierName: cashierData?.name || "Kasir", outletName: outletData?.name || "Outlet" });
        setOrderResult(result);
        resetForm();
        queryClient.invalidateQueries({ queryKey: ["loyalty", "members", outletId] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
        queryClient.invalidateQueries({ queryKey: ["cashier-tables"] });
        queryClient.invalidateQueries({ queryKey: ["cashier-bills"] });
        toast.success(isSaved ? "Pesanan berhasil disimpan!" : "Pesanan berhasil dibayar!");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || error?.message || "Gagal membuat pesanan");
      },
    });
  };

  const validationHint = hasUnscheduledService
    ? "Pilih jadwal layanan terlebih dahulu"
    : isFnbOrCustom && !tableId && !isWalkIn
      ? "Pilih meja untuk melanjutkan pesanan"
      : "Lengkapi data pelanggan dan nominal pembayaran";

  const showValidationHint = !canSubmit && paymentMethod !== "none" && cartItems.length > 0;

  // Tinggi fixed bar: action bar (~76px) + bottom nav (~60px) = 136px
  const MOBILE_BOTTOM_OFFSET = "bottom-[60px]";
  const MOBILE_CONTENT_PB = "pb-[148px]";

  return (
    <CashierShiftGate outletId={outletId} outletType={outletData?.type as any}>
      <div className={`mx-auto flex w-full max-w-[1400px] flex-col gap-3 p-3 lg:pb-3 ${MOBILE_CONTENT_PB}`}>

        {/* Retail: Barcode Bar */}
        {isRetail && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  <ScanBarcode className="h-4 w-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-foreground">Scan Barcode</p>
                  <p className="text-[10px] text-muted-foreground">Enter untuk submit</p>
                </div>
              </div>
              <input
                ref={retailBarcodeRef}
                type="text"
                value={retailBarcodeBuffer}
                onChange={(e) => setRetailBarcodeBuffer(e.target.value)}
                onKeyDown={handleRetailBarcodeKeyDown}
                placeholder="Scan atau ketik barcode..."
                className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoComplete="off"
              />
              {lastScannedProduct && (
                <div className="hidden sm:flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <span className="text-xs font-bold text-emerald-600 truncate max-w-[120px]">✓ {lastScannedProduct.name}</span>
                </div>
              )}
              <div className="hidden lg:flex items-center gap-1">
                {["F1 Scan", "F2 Walk-in", "F8 Bayar", "Esc Clear"].map((k) => (
                  <Badge key={k} variant="outline" className="text-[9px] font-bold px-1.5 py-0.5 bg-muted/50 border-border/60 rounded-sm">{k}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Retail: Express total */}
        {isRetail && cartItems.length > 0 && (
          <div className="flex items-center justify-between rounded-md border border-border/60 bg-card px-4 py-2.5">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs px-2.5">
              {totalCartItems} item
            </Badge>
            <p className="text-2xl font-black text-foreground tabular-nums tracking-tight">
              Rp {grandTotal.toLocaleString("id-ID")}
            </p>
          </div>
        )}

        <CashSummaryBar data={cashSummary} isLoading={summaryLoading} />

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden rounded-md border border-border/50 bg-muted/30 p-1 gap-1">
          <button
            onClick={() => setMobileView("catalog")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm py-2 text-sm font-semibold transition-colors ${mobileView === "catalog" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Package className="h-4 w-4" />
            Katalog
          </button>
          <button
            onClick={() => setMobileView("cart")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-sm py-2 text-sm font-semibold transition-colors ${mobileView === "cart" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <ShoppingCart className="h-4 w-4" />
            Keranjang
            {totalCartItems > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid gap-3 lg:grid-cols-[1fr_380px] items-start">

          {/* LEFT: Catalog panel */}
          <div
            className={`flex flex-col rounded-md border border-border/60 overflow-hidden bg-card lg:sticky lg:top-3 ${mobileView === "catalog" ? "flex" : "hidden lg:flex"}`}
            style={{ height: "calc(100svh - 6.25rem)" }}
          >
            <div className="flex shrink-0 border-b border-border/40 bg-muted/20">
              <button
                onClick={() => setLeftTab("catalog")}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors ${leftTab === "catalog" ? "border-b-2 border-primary bg-background text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
              >
                <Package className="h-4 w-4" />
                Katalog
                {products.length > 0 && (
                  <Badge variant="secondary" className="rounded-sm px-1.5 text-xs tabular-nums">{products.length}</Badge>
                )}
              </button>
              {isFnbOrCustom && (
                <button
                  onClick={() => setLeftTab("open")}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors ${leftTab === "open" ? "border-b-2 border-primary bg-background text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
                >
                  <Clock className="h-4 w-4" />
                  Tersimpan
                  {openOrders.length > 0 && (
                    <Badge className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {openOrders.length}
                    </Badge>
                  )}
                </button>
              )}
              <button
                onClick={() => setLeftTab("recent")}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors ${leftTab === "recent" ? "border-b-2 border-primary bg-background text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
              >
                <ReceiptText className="h-4 w-4" />
                Riwayat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {leftTab === "catalog" && (
                <ProductCatalog
                  products={products} isLoading={productsLoading}
                  searchQuery={searchQuery} onSearchChange={setSearchQuery}
                  onAddToCart={handleAddToCart}
                  onScanBarcode={handleScanBarcode}
                  cartQuantities={cartQuantities} outletType={outletData?.type}
                />
              )}
              {leftTab === "open" && <OpenOrders orders={openOrders} isLoading={openLoading} onSelect={handleSelectOpenOrder} />}
              {leftTab === "recent" && <RecentOrders orders={recentOrders} isLoading={recentLoading} />}
            </div>
          </div>

          {/* RIGHT: Cart panel */}
          <div
            className={`flex flex-col rounded-md border border-border/60 overflow-hidden bg-card lg:sticky lg:top-3 ${mobileView === "cart" ? "flex" : "hidden lg:flex"}`}
            style={{ height: "calc(100svh - 6.25rem)" }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Keranjang</p>
                  <p className="text-xs text-muted-foreground">
                    {cartItems.length === 0 ? "Belum ada item" : `${cartItems.length} produk · ${totalCartItems} item`}
                  </p>
                </div>
              </div>
              {totalCartItems > 0 && (
                <Badge className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
                  {totalCartItems}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 p-3">
                <CartPanel
                  items={cartItems} onIncrease={handleIncrease}
                  onDecrease={handleDecrease} onRemove={handleRemove}
                  onClear={handleClearCart} onScheduleService={handleScheduleService}
                />
                {cartItems.length > 0 && (
                  <>
                    <Separator className="bg-border/60" />
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <ReceiptText className="h-4 w-4 text-primary" />
                        Pelanggan & Pembayaran
                      </p>
                      <CustomerInfo
                        outletId={outletId} isWalkIn={isWalkIn} onWalkInChange={setIsWalkIn}
                        name={customerName} onNameChange={setCustomerName}
                        phone={customerPhone} onPhoneChange={setCustomerPhone}
                        onMemberChange={setMember} loyaltyConfig={loyaltyConfig}
                        loyaltyDiscount={loyaltyDiscount} onPointsRedeemedChange={setPointsRedeemed}
                        pointsRedeemed={pointsRedeemed} subtotal={subtotal}
                        outletType={outletData?.type} tableNumber={tableNumber}
                        onTableNumberChange={setTableNumber} tableId={tableId}
                        onTableIdChange={setTableId}
                      />
                      <Separator className="bg-border/60" />
                      <PaymentSection
                        method={paymentMethod} onMethodChange={setPaymentMethod}
                        total={grandTotal} cashReceived={cashReceived}
                        onCashReceivedChange={setCashReceived}
                        qrisImageUrl={outletQris?.qrisImageUrl} isLoadingQris={qrisLoading}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pinned bottom — desktop only */}
            <div className="hidden lg:block shrink-0 space-y-2 border-t border-border/60 bg-background p-3">
              {showValidationHint && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  <p className="text-xs text-destructive">{validationHint}</p>
                </div>
              )}
              {isFnbOrCustom && (
                <Button
                  variant="outline"
                  onClick={() => handleSubmitOrder(true)}
                  disabled={cartItems.length === 0 || createOrder.isPending}
                  className="h-10 w-full text-sm font-semibold border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                >
                  Simpan Pesanan
                </Button>
              )}
              <Button
                onClick={() => setShowPayConfirm(true)}
                disabled={!canSubmit || createOrder.isPending}
                className="h-11 w-full text-sm font-bold tabular-nums"
              >
                {createOrder.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                  : `Bayar  Rp ${grandTotal.toLocaleString("id-ID")}`
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed action bar — di atas bottom nav */}
      <div className={`lg:hidden fixed ${MOBILE_BOTTOM_OFFSET} inset-x-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 space-y-2`}>
        {showValidationHint && mobileView === "cart" && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{validationHint}</p>
          </div>
        )}
        <div className="flex gap-2">
          {isFnbOrCustom && (
            <Button
              variant="outline"
              onClick={() => handleSubmitOrder(true)}
              disabled={cartItems.length === 0 || createOrder.isPending}
              className="h-11 flex-1 text-sm font-semibold border-primary/30 text-primary hover:bg-primary/5"
            >
              Simpan
            </Button>
          )}
          <Button
            onClick={() => setShowPayConfirm(true)}
            disabled={!canSubmit || createOrder.isPending}
            className="h-11 flex-1 text-sm font-bold tabular-nums"
          >
            {createOrder.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
              : `Bayar  Rp ${grandTotal.toLocaleString("id-ID")}`
            }
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={!!pendingOpenOrder} onOpenChange={(v) => !v && setPendingOpenOrder(null)}
        title="Ganti keranjang?"
        description="Keranjang saat ini akan dihapus untuk memuat pesanan yang dipilih. Lanjutkan?"
        confirmLabel="Ya, lanjutkan"
        onConfirm={() => { pendingOpenOrder && applyOpenOrder(pendingOpenOrder); }}
      />
      <OrderSuccessDialog
        open={!!orderResult} result={orderResult} printContext={orderPrintContext}
        onClose={() => { setOrderResult(null); setOrderPrintContext(null); }}
      />
      <ServiceScheduleDialog
        open={!!scheduleDialog} product={scheduleDialog?.product ?? null}
        existingSelection={scheduleDialog?.selection}
        onClose={() => setScheduleDialog(null)} onConfirm={handleScheduleConfirm}
      />
      <ConfirmDialog
        open={showPayConfirm} onOpenChange={setShowPayConfirm}
        title="Konfirmasi Pembayaran"
        description={`Apakah Anda yakin ingin memproses pembayaran sebesar Rp ${grandTotal.toLocaleString("id-ID")}?`}
        confirmLabel="Ya, Bayar Sekarang"
        onConfirm={() => { setShowPayConfirm(false); handleSubmitOrder(false); }}
      />
    </CashierShiftGate>
  );
}