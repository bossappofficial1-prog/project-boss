import StockTransferContent from "@/features/owner/stock-transfer/stock-transfer-content";

export const metadata = {
  title: "Transfer Outlet | BOSS Dashboard",
  description: "Kelola pengiriman stok produk antar outlet Anda secara real-time.",
};

export default function OwnerStockTransferPage() {
  return <StockTransferContent />;
}
