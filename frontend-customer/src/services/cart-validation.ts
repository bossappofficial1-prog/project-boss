import { Product as ProductService } from './product';
import { Outlet as OutletService } from './outlets';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    data?: any;
}

export interface CartValidationResult {
    validItems: string[];
    invalidItems: Array<{
        itemId: string;
        reason: string;
        type: 'outlet' | 'product';
    }>;
    summary: {
        totalValid: number;
        totalInvalid: number;
        outletsChecked: number;
        productsChecked: number;
    };
}

export class CartValidationService {
    /**
     * Validasi ketersediaan outlet
     */
    static async validateOutlet(slug: string): Promise<ValidationResult> {
        if (!slug) {
            return {
                isValid: false,
                error: 'Outlet slug is missing'
            };
        }
        try {
            const outlet = await OutletService.getDetail(slug);
            return {
                isValid: !!outlet,
                data: outlet
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Outlet not found'
            };
        }
    }

    /**
     * Validasi ketersediaan produk
     */
    static async validateProduct(productId: string): Promise<ValidationResult> {
        try {
            const product = await ProductService.getDetail(productId);
            const isValid = !!(product && product.status === 'ACTIVE');

            return {
                isValid,
                data: product,
                error: !isValid ? 'Product is no longer available or inactive' : undefined
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Product not found'
            };
        }
    }

    /**
     * Validasi semua item dalam cart
     */
    static async validateCartItems(cartItems: Array<{
        id: string;
        slug: string;
        productId: string;
        name: string;
        outletName: string;
    }>): Promise<CartValidationResult> {
        if (cartItems.length === 0) {
            return {
                validItems: [],
                invalidItems: [],
                summary: {
                    totalValid: 0,
                    totalInvalid: 0,
                    outletsChecked: 0,
                    productsChecked: 0
                }
            };
        }

        // Kumpulkan ID unik untuk outlet dan produk
        const uniqueOutletSlugs = [...new Set(cartItems.map(item => item.slug))];
        const uniqueProductIds = [...new Set(cartItems.map(item => item.productId))];

        // Validasi outlet secara paralel
        const outletValidations = await Promise.all(
            uniqueOutletSlugs.map(async (slug) => ({
                id: slug,
                result: await this.validateOutlet(slug)
            }))
        );

        // Validasi produk secara paralel
        const productValidations = await Promise.all(
            uniqueProductIds.map(async (productId) => ({
                id: productId,
                result: await this.validateProduct(productId)
            }))
        );

        // Buat map untuk akses cepat hasil validasi
        const outletValidationMap = new Map(
            outletValidations.map(v => [v.id, v.result])
        );
        const productValidationMap = new Map(
            productValidations.map(v => [v.id, v.result])
        );

        // Evaluasi setiap item cart
        const validItems: string[] = [];
        const invalidItems: Array<{
            itemId: string;
            reason: string;
            type: 'outlet' | 'product';
        }> = [];

        cartItems.forEach(item => {
            const outletValidation = outletValidationMap.get(item.slug);
            const productValidation = productValidationMap.get(item.productId);

            // Cek outlet dulu
            if (!outletValidation?.isValid) {
                invalidItems.push({
                    itemId: item.id,
                    reason: `Outlet "${item.outletName}" is no longer available`,
                    type: 'outlet'
                });
                return;
            }

            // Cek produk
            if (!productValidation?.isValid) {
                invalidItems.push({
                    itemId: item.id,
                    reason: `Product "${item.name}" is no longer available`,
                    type: 'product'
                });
                return;
            }

            // Item valid
            validItems.push(item.id);
        });

        return {
            validItems,
            invalidItems,
            summary: {
                totalValid: validItems.length,
                totalInvalid: invalidItems.length,
                outletsChecked: uniqueOutletSlugs.length,
                productsChecked: uniqueProductIds.length
            }
        };
    }

    /**
     * Validasi item cart secara batch dengan retry logic
     */
    static async validateCartWithRetry(
        cartItems: Array<{
            id: string;
            slug: string;
            productId: string;
            name: string;
            outletName: string;
        }>,
        maxRetries: number = 2
    ): Promise<CartValidationResult> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this.validateCartItems(cartItems);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown validation error');

                if (attempt < maxRetries) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }

        // Jika semua retry gagal, return hasil fallback
        console.error('Cart validation failed after retries:', lastError);
        return {
            validItems: [],
            invalidItems: cartItems.map(item => ({
                itemId: item.id,
                reason: 'Unable to verify availability',
                type: 'outlet' as const
            })),
            summary: {
                totalValid: 0,
                totalInvalid: cartItems.length,
                outletsChecked: 0,
                productsChecked: 0
            }
        };
    }
}
