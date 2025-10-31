import { getCookie } from "@/lib/utils";
import { useState } from "react";

type Profile = {
    full_name: string;
    phone: string;
    saved_theme: "light" | "dark";
    saved_language: "id" | "en";
    count_saved_outlet: number;
    count_saved_product: number;
}

export function useProfileInfo() {
    const [profileUser] = useState<Profile | null>(() => {
        if (typeof window === 'undefined') return null;

        const userPrefrencedRaw = localStorage?.getItem("user_preferences")
        const savedProductsRaw = localStorage?.getItem("saved-products")
        const favoriteOutletsRaw = localStorage?.getItem("favorite-outlets")

        const savedUserPreferenced = JSON.parse(userPrefrencedRaw!)
        const savedProductsCount = savedProductsRaw?.length || 0
        const favoriteOutletsCount = favoriteOutletsRaw?.length || 0
        const saved_language = getCookie("locale") as any || "id"

        return {
            full_name: savedUserPreferenced?.fullName,
            phone: savedUserPreferenced?.phone,
            saved_theme: savedUserPreferenced?.theme,
            count_saved_outlet: favoriteOutletsCount,
            count_saved_product: savedProductsCount,
            saved_language
        }
    })

    return { profileUser }
}