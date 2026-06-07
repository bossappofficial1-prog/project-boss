"use client";

interface HeaderProps {
  outletName?: string;
}

export default function ProductsHeader({ outletName }: HeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Kelola Produk/Jasa</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Kelola produk dan jasa untuk outlet {outletName || '-'}
        </p>
      </div>
    </div>
  );
}
