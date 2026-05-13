export const PAYMENT_METHODS = [
    { id: "cash", label: "Cash" },
    { id: "card", label: "Card" },
    { id: "wallet", label: "Wallet" }
]

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];