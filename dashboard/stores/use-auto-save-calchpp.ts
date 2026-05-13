import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BusinessType = "manufaktur" | "dagang" | "fnb" | "jasa" | "custom";

const generateId = () => Math.random().toString(36).slice(2, 9);

interface CostCategory {
  id: string;
  collapsed: boolean;
  name: string;
  items: CostItem[];
}

interface CostItem {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface AutoSaveCalchppState {
  businessType: BusinessType;
  targetMargin: number;
  units: number;

  setBusinessType: (businessType: BusinessType) => void;
  setTargetMargin: (targetMargin: number) => void;
  setUnits: (units: number) => void;
  updateCategoryName: (categoryId: string, newName: string) => void;
  addCategory: (categoryName: string) => void;
  removeCategory: (categoryId: string) => void;
  addItem: (categoryId: string, itemName: string) => void;
  removeItem: (catId: string, itemId: string) => void;
  updateItem: (
    catId: string,
    itemId: string,
    field: keyof CostItem,
    value: string | number,
  ) => void;
  toggleCollapse: (categoryId: string) => void;
  preset: Record<
    BusinessType,
    {
      label: string;
      unitLabel: string;
      categories: CostCategory[];
    }
  >;

  isAutoSaving: boolean;
  setIsAutoSaving: (isAutoSaving: boolean) => void;
}

const preset = {
  manufaktur: {
    label: "Manufaktur",
    unitLabel: "unit produksi",
    categories: [
      {
        id: "bahan-baku",
        name: "Bahan Baku",
        collapsed: false,
        items: [
          {
            id: "bahan-baku-utama",
            name: "Bahan baku utama",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "bahan-penolong",
            name: "Bahan penolong",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "tenaga-kerja-langsung",
        name: "Tenaga Kerja Langsung",
        collapsed: false,
        items: [
          {
            id: "upah-operator",
            name: "Upah operator",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "overhead-pabrik",
        name: "Overhead Pabrik",
        collapsed: false,
        items: [
          {
            id: "listrik-air-dialokasi",
            name: "Listrik & air (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "penyusutan-mesin-dialokasi",
            name: "Penyusutan mesin (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "biaya-pemeliharaan-dialokasi",
            name: "Biaya pemeliharaan (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
    ],
  },
  dagang: {
    label: "Perdagangan",
    unitLabel: "unit barang",
    categories: [
      {
        id: "harga-pokok-pembelian",
        name: "Harga Pokok Pembelian",
        collapsed: false,
        items: [
          {
            id: "harga-beli-barang",
            name: "Harga beli barang",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "diskon-pembelian",
            name: "Diskon pembelian",
            quantity: -1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "biaya-pengadaan",
        name: "Biaya Pengadaan",
        collapsed: false,
        items: [
          {
            id: "ongkos-kirim-masuk",
            name: "Ongkos kirim masuk",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "biaya-bongkar-muat",
            name: "Biaya bongkar muat",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "pajak-impor",
            name: "Pajak impor",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "biaya-penyimpanan",
        name: "Biaya Penyimpanan",
        collapsed: false,
        items: [
          {
            id: "sewa-gudang-dialokasi",
            name: "Sewa gudang (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "asuransi-barang",
            name: "Asuransi barang",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
    ],
  },
  fnb: {
    label: "F&B / Kuliner",
    unitLabel: "porsi",
    categories: [
      {
        id: "bahan-baku",
        name: "Bahan Baku",
        collapsed: false,
        items: [
          {
            id: "bahan-utama",
            name: "Bahan utama",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "bumbu-rempah",
            name: "Bumbu & rempah",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "minuman-pelengkap",
            name: "Minuman / pelengkap",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "kemasan",
        name: "Kemasan",
        collapsed: false,
        items: [
          {
            id: "box-wadah",
            name: "Box / wadah",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "label-stiker",
            name: "Label / stiker",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "kantong-plastik",
            name: "Kantong plastik",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "biaya-produksi",
        name: "Biaya Produksi",
        collapsed: false,
        items: [
          {
            id: "gas-listrik-dialokasi",
            name: "Gas / listrik (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "upah-juru-masak-dialokasi",
            name: "Upah juru masak (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
    ],
  },
  jasa: {
    label: "Jasa",
    unitLabel: "pekerjaan / proyek",
    categories: [
      {
        id: "biaya-sdm",
        name: "Biaya SDM",
        collapsed: false,
        items: [
          {
            id: "honor-gaji-tenaga-ahli",
            name: "Honor / gaji tenaga ahli",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "tunjangan-benefit",
            name: "Tunjangan & benefit",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "biaya-operasional",
        name: "Biaya Operasional",
        collapsed: false,
        items: [
          {
            id: "alat-perlengkapan",
            name: "Alat & perlengkapan",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "transportasi-perjalanan",
            name: "Transportasi / perjalanan",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "software-lisensi-dialokasi",
            name: "Software / lisensi (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
      {
        id: "overhead",
        name: "Overhead",
        collapsed: false,
        items: [
          {
            id: "sewa-kantor-dialokasi",
            name: "Sewa kantor (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
          {
            id: "listrik-internet-dialokasi",
            name: "Listrik & internet (dialokasi)",
            quantity: 1,
            unitCost: 0,
          },
        ],
      },
    ],
  },
  custom: {
    label: "Custom",
    unitLabel: "unit",
    categories: [
      {
        id: "biaya-langsung",
        name: "Biaya Langsung",
        collapsed: false,
        items: [],
      },
      {
        id: "biaya-tidak-langsung",
        name: "Biaya Tidak Langsung",
        collapsed: false,
        items: [],
      },
    ],
  },
};

export const useAutoSaveCalchpp = create<AutoSaveCalchppState>()(
  persist(
    (set) => ({
      preset: preset,
      isAutoSaving: false,
      businessType: "custom",
      units: 1,
      targetMargin: 30,

      setBusinessType(businessType) {
        set({ businessType });
      },
      setIsAutoSaving: (isAutoSaving) => set({ isAutoSaving }),
      setTargetMargin: (targetMargin) => set({ targetMargin }),
      setUnits: (units) => set({ units }),

      updateCategoryName: (categoryId, newName) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              name: newName,
            };
          });

          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      removeCategory: (categoryId: string) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.filter((cat) => cat.id !== categoryId);
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      removeItem: (catId, itemId) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.map((cat) => {
            if (cat.id !== catId) return cat;
            return {
              ...cat,
              items: cat.items.filter((item) => item.id !== itemId),
            };
          });
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      updateItem: (catId, itemId, field, value) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.map((cat) => {
            if (cat.id !== catId) return cat;
            return {
              ...cat,
              items: cat.items.map((item) => {
                if (item.id !== itemId) return item;
                return {
                  ...item,
                  [field]: value,
                };
              }),
            };
          });
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      toggleCollapse: (categoryId) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              collapsed: !cat.collapsed,
            };
          });
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      addItem: (categoryId: string, itemName: string) => {
        set((state) => {
          const updatedCategories = state.preset[
            state.businessType
          ].categories.map((cat) => {
            if (cat.id !== categoryId) return cat;
            const newItem = {
              id: generateId(),
              name: itemName,
              quantity: 1,
              unitCost: 0,
            };
            return {
              ...cat,
              items: [...cat.items, newItem],
            };
          });
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: updatedCategories,
              },
            },
          };
        });
      },
      addCategory: (categoryName: string) => {
        set((state) => {
          const newCategory = {
            id: generateId(),
            name: categoryName,
            collapsed: false,
            items: [],
          };
          return {
            preset: {
              ...state.preset,
              [state.businessType]: {
                ...state.preset[state.businessType],
                categories: [
                  ...state.preset[state.businessType].categories,
                  newCategory,
                ],
              },
            },
          };
        });
      },
    }),
    { name: "auto-save-calchpp" },
  ),
);
