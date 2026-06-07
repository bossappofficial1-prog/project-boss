export interface ProfitPerProductData {
  period: Period;
  summary: Summary;
  products: Product[];
}

export interface Period {
  startDate: string;
  endDate: string;
}

export interface Summary {
  totalRevenue: number;
  totalHppCost: number;
  totalProfit: number;
  avgMarginPercentage: number;
  totalQtySold: number;
  totalOrders: number;
}

export interface Product {
  productId: string;
  productName: string;
  image: string;
  unit: string;
  totalQtySold: number;
  totalRevenue: number;
  totalHppCost: number;
  totalProfit: number;
  marginPercentage: number;
  avgSellingPrice: number;
  avgHpp: number;
  contribution: number;
}
