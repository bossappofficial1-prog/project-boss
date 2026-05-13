"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
}

interface VariableCostItem {
  id: string;
  name: string;
  amountPerUnit: number;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNum(val: string): number {
  const clean = val.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

const DEFAULT_FIXED: FixedCostItem[] = [
  { id: generateId(), name: "Sewa tempat", amount: 0 },
  { id: generateId(), name: "Gaji karyawan tetap", amount: 0 },
  { id: generateId(), name: "Listrik & utilitas", amount: 0 },
  { id: generateId(), name: "Cicilan / leasing", amount: 0 },
];

const DEFAULT_VARIABLE: VariableCostItem[] = [
  { id: generateId(), name: "Bahan baku / HPP", amountPerUnit: 0 },
  { id: generateId(), name: "Komisi penjualan", amountPerUnit: 0 },
  { id: generateId(), name: "Biaya pengiriman", amountPerUnit: 0 },
];

function CollapsibleSection({
  title,
  total,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  total: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="py-0 gap-0 shadow-none border-border/50">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <span className="font-medium text-base">{title}</span>
          <span className="ml-auto text-sm font-medium tabular-nums">
            {total}
          </span>
        </div>
      </CardHeader>
      {!collapsed && <CardContent className="p-4 pt-3">{children}</CardContent>}
    </Card>
  );
}

export default function BepCalculator() {
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>(DEFAULT_FIXED);
  const [variableCosts, setVariableCosts] =
    useState<VariableCostItem[]>(DEFAULT_VARIABLE);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [fixedCollapsed, setFixedCollapsed] = useState(false);
  const [variableCollapsed, setVariableCollapsed] = useState(false);

  const updateFixed = (
    id: string,
    field: keyof FixedCostItem,
    value: string,
  ) => {
    setFixedCosts((prev) =>
      prev.map((item) =>
        item.id !== id
          ? item
          : { ...item, [field]: field === "name" ? value : parseNum(value) },
      ),
    );
  };

  const updateVariable = (
    id: string,
    field: keyof VariableCostItem,
    value: string,
  ) => {
    setVariableCosts((prev) =>
      prev.map((item) =>
        item.id !== id
          ? item
          : { ...item, [field]: field === "name" ? value : parseNum(value) },
      ),
    );
  };

  const {
    totalFixed,
    totalVariablePerUnit,
    contributionMargin,
    bepUnit,
    bepRupiah,
    cmRatio,
  } = useMemo(() => {
    const totalFixed = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
    const totalVariablePerUnit = variableCosts.reduce(
      (sum, item) => sum + item.amountPerUnit,
      0,
    );
    const contributionMargin = sellingPrice - totalVariablePerUnit;
    const cmRatio =
      sellingPrice > 0 ? (contributionMargin / sellingPrice) * 100 : 0;
    const bepUnit =
      contributionMargin > 0 ? Math.ceil(totalFixed / contributionMargin) : 0;
    const bepRupiah = bepUnit * sellingPrice;
    return {
      totalFixed,
      totalVariablePerUnit,
      contributionMargin,
      bepUnit,
      bepRupiah,
      cmRatio,
    };
  }, [fixedCosts, variableCosts, sellingPrice]);

  const isValid = sellingPrice > 0 && contributionMargin > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kalkulator BEP
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hitung titik impas usaha dalam unit dan rupiah
          </p>
        </div>
        {isValid && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            BEP: {bepUnit.toLocaleString("id-ID")} unit
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Harga Jual */}
          <Card className="py-0 gap-0shadow-none border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium shrink-0">
                  Harga Jual per Unit
                </Label>
                <Input
                  type="number"
                  min={0}
                  className="rounded-md max-w-xs"
                  placeholder="Contoh: 25000"
                  value={sellingPrice || ""}
                  onChange={(e) => setSellingPrice(parseNum(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Biaya Tetap */}
          <CollapsibleSection
            title="Biaya Tetap (per bulan)"
            total={formatRupiah(totalFixed)}
            collapsed={fixedCollapsed}
            onToggle={() => setFixedCollapsed(!fixedCollapsed)}
          >
            <div className="space-y-2">
              {fixedCosts.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-1">
                  <span className="col-span-7 text-xs text-muted-foreground">
                    Nama Biaya
                  </span>
                  <span className="col-span-4 text-xs text-muted-foreground text-right">
                    Jumlah (Rp)
                  </span>
                </div>
              )}
              {fixedCosts.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <Input
                    className="col-span-7 rounded-md h-8 text-sm"
                    placeholder="Nama biaya tetap"
                    value={item.name}
                    onChange={(e) =>
                      updateFixed(item.id, "name", e.target.value)
                    }
                  />
                  <Input
                    className="col-span-4 rounded-md h-8 text-sm text-right"
                    type="number"
                    placeholder="0"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateFixed(item.id, "amount", e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setFixedCosts((prev) =>
                        prev.filter((i) => i.id !== item.id),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-1 mt-1"
                onClick={() =>
                  setFixedCosts((prev) => [
                    ...prev,
                    { id: generateId(), name: "", amount: 0 },
                  ])
                }
              >
                <Plus className="h-3 w-3" />
                Tambah biaya tetap
              </Button>
            </div>
          </CollapsibleSection>

          {/* Biaya Variabel */}
          <CollapsibleSection
            title="Biaya Variabel (per unit)"
            total={formatRupiah(totalVariablePerUnit)}
            collapsed={variableCollapsed}
            onToggle={() => setVariableCollapsed(!variableCollapsed)}
          >
            <div className="space-y-2">
              {variableCosts.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-1">
                  <span className="col-span-7 text-xs text-muted-foreground">
                    Nama Biaya
                  </span>
                  <span className="col-span-4 text-xs text-muted-foreground text-right">
                    Per Unit (Rp)
                  </span>
                </div>
              )}
              {variableCosts.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <Input
                    className="col-span-7 rounded-md h-8 text-sm"
                    placeholder="Nama biaya variabel"
                    value={item.name}
                    onChange={(e) =>
                      updateVariable(item.id, "name", e.target.value)
                    }
                  />
                  <Input
                    className="col-span-4 rounded-md h-8 text-sm text-right"
                    type="number"
                    placeholder="0"
                    value={item.amountPerUnit || ""}
                    onChange={(e) =>
                      updateVariable(item.id, "amountPerUnit", e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="col-span-1 h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setVariableCosts((prev) =>
                        prev.filter((i) => i.id !== item.id),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-1 mt-1"
                onClick={() =>
                  setVariableCosts((prev) => [
                    ...prev,
                    { id: generateId(), name: "", amountPerUnit: 0 },
                  ])
                }
              >
                <Plus className="h-3 w-3" />
                Tambah biaya variabel
              </Button>
            </div>
          </CollapsibleSection>
        </div>

        {/* Summary */}
        <div>
          <Card className="shadow-none py-0 gap-0 border-border/50 sticky top-6">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Hasil Perhitungan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga jual</span>
                  <span className="tabular-nums">
                    {formatRupiah(sellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Biaya variabel/unit
                  </span>
                  <span className="tabular-nums">
                    - {formatRupiah(totalVariablePerUnit)}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t border-border/50 pt-2">
                  <span>Contribution Margin</span>
                  <span
                    className={`tabular-nums ${contributionMargin < 0 ? "text-destructive" : ""}`}
                  >
                    {formatRupiah(contributionMargin)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>CM Ratio</span>
                  <span className="tabular-nums">{cmRatio.toFixed(1)}%</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total biaya tetap</span>
                <span className="tabular-nums">{formatRupiah(totalFixed)}</span>
              </div>

              <Separator />

              {!isValid ? (
                <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground text-center">
                  {sellingPrice === 0
                    ? "Isi harga jual terlebih dahulu"
                    : contributionMargin <= 0
                      ? "Harga jual harus lebih besar dari biaya variabel"
                      : "Lengkapi data untuk melihat BEP"}
                </div>
              ) : (
                <>
                  <div className="bg-muted rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      BEP dalam Unit
                    </p>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                      {bepUnit.toLocaleString("id-ID")}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        unit
                      </span>
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      BEP dalam Rupiah
                    </p>
                    <p className="text-2xl font-semibold tracking-tight tabular-nums text-primary">
                      {formatRupiah(bepRupiah)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Omzet minimum per bulan untuk tidak rugi
                    </p>
                  </div>

                  {/* Tabel target profit */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Simulasi target profit
                    </p>
                    {[0, 1000000, 3000000, 5000000, 10000000].map(
                      (targetProfit) => {
                        const unitsNeeded =
                          contributionMargin > 0
                            ? Math.ceil(
                                (totalFixed + targetProfit) /
                                  contributionMargin,
                              )
                            : 0;
                        return (
                          <div
                            key={targetProfit}
                            className="flex justify-between text-xs py-1 border-b border-border/30 last:border-0"
                          >
                            <span className="text-muted-foreground">
                              Profit{" "}
                              {targetProfit === 0
                                ? "impas"
                                : formatRupiah(targetProfit)}
                            </span>
                            <span className="tabular-nums font-medium">
                              {unitsNeeded.toLocaleString("id-ID")} unit
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
