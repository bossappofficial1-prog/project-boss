import { Order } from "@/services/order";
import { PaymentMethod } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Building2, ChevronRight, QrCode, Shield, Wallet, CheckCircle2, Loader2, AlertTriangle, ClipboardCheck } from "lucide-react";
import { Button } from "../ui/button";
import { ImageRender } from "../shared/Image";
import { Badge } from "../ui/badge";
import { ErrorState, LoadingState, EmptyState } from "../Base";
import { useTranslations } from "@/hooks/useI18n";

const PaymentMethodsList: React.FC<{
    onSelectPayment: (method: PaymentMethod) => void;
    selectedPayment?: PaymentMethod | null;
}> = ({ onSelectPayment, selectedPayment }) => {
    const t = useTranslations("payment");
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'qris' | 'va' | 'manual'>('all');
    const { data: paymentMethods, isLoading, error, refetch } = useQuery({
        queryKey: ["payment-methods"],
        queryFn: Order.getPaymentMethodList,
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const filteredMethods = selectedCategory === 'all'
        ? paymentMethods
        : paymentMethods?.filter(method => method.type === selectedCategory);

    const categories = [
        { id: 'all' as const, label: t("categories.all"), icon: Wallet, count: paymentMethods?.length || 0 },
        { id: 'qris' as const, label: t("categories.qris"), icon: QrCode, count: paymentMethods?.filter(m => m.type === 'qris').length || 0 },
        { id: 'va' as const, label: t("categories.va"), icon: Building2, count: paymentMethods?.filter(m => m.type === 'va').length || 0 },
        { id: 'manual' as const, label: t("categories.manual"), icon: ClipboardCheck, count: paymentMethods?.filter(m => m.type === 'manual').length || 0 },
    ];

    if (error) {
        return (
            <div className="px-4">
                <ErrorState
                    title={t("error.title")}
                    message={t("error.message")}
                    onRetry={() => refetch()}
                    icon={<AlertTriangle className="w-6 h-6 text-destructive" />}
                    iconClassName="bg-destructive/10"
                />
            </div>
        );
    }

    return (
        <>
            <Card className="shadow-sm  ">
                <CardHeader className="pb-1 px-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-primary" />
                            </div>
                            {t("title")}
                        </CardTitle>
                    </div>

                    {/* Mobile-Optimized Category Tabs */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const isActive = selectedCategory === category.id;

                            return (
                                <Button
                                    key={category.id}
                                    variant={isActive ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`h-9 px-3 whitespace-nowrap transition-all duration-200 flex-shrink-0 text-[11px] sm:text-xs ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 dark:hover:border-primary/50'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="truncate max-w-[60px]">{category.label}</span>
                                    <Badge
                                        variant="secondary"
                                        className={`ml-1.5 text-xs px-1.5 py-0.5 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted dark:bg-gray-700'
                                            }`}
                                    >
                                        {category.count}
                                    </Badge>
                                </Button>
                            );
                        })}
                    </div>
                </CardHeader>

                <CardContent className="pt-0 px-4 pb-4">
                    <div className="space-y-2">
                        {isLoading ? (
                            <LoadingState
                                message={t("loading")}
                                size="md"
                            />
                        ) : filteredMethods && filteredMethods.length > 0 ? (
                            filteredMethods.map((method) => {
                                const isSelected = selectedPayment?.id === method.id;

                                return (
                                    <button
                                        key={method.id}
                                        disabled={method.disable}
                                        onClick={() => onSelectPayment(method)}
                                        className={`w-full p-3 border-2 rounded-lg transition-all duration-300 group relative overflow-hidden min-h-[60px] ${isSelected
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-1 ring-primary/20'
                                            : method.disable
                                                ? 'border-gray-200 dark:border-gray-700 opacity-60 grayscale cursor-not-allowed'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/2 dark:hover:bg-primary/5 hover:shadow-sm'
                                            }`}
                                    >
                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pr-6">
                                            <div className="flex items-center gap-3">
                                                {/* Payment Method Icon */}
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${isSelected
                                                    ? 'bg-gray-300'
                                                    : 'bg-gray-50 '
                                                    }`}>
                                                    <ImageRender
                                                        src={method.image_url}
                                                        alt={method.name}
                                                        className="w-6 h-6 object-contain"
                                                    />
                                                </div>

                                                {/* Payment Method Details */}
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className={`text-[13px] font-semibold transition-colors truncate sm:text-sm ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-gray-100 group-hover:text-primary'
                                                        }`}>
                                                        {method.name}
                                                    </div>
                                                    <div className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground dark:text-gray-400 sm:text-xs">
                                                        {method.description}
                                                    </div>

                                                    {/* Payment Type Badge */}
                                                    <div className="mt-1.5 flex items-center gap-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs px-1.5 py-0.5 ${method.type === 'qris'
                                                                ? 'border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/50'
                                                                : method.type === 'va'
                                                                    ? 'border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/50'
                                                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
                                                                }`}
                                                        >
                                                            {method.type === 'qris'
                                                                ? t("types.qris")
                                                                : method.type === 'va'
                                                                    ? t("types.va")
                                                                    : t("types.manual")}
                                                        </Badge>
                                                        {method.disable && <p className="text-xs">Akan tersedia segera</p>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Arrow Indicator */}
                                            <div className={`transition-all duration-300 ${isSelected ? 'text-primary' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'
                                                }`}>
                                                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'
                                                    }`} />
                                            </div>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/5 dark:to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                                    </button>
                                );
                            })
                        ) : (
                            <EmptyState
                                icon={<Wallet className="w-6 h-6 text-gray-400" />}
                                title={t("empty.title")}
                                description={t("empty.description")}
                                className="py-6"
                            />
                        )}
                    </div>

                    {/* Mobile-Optimized Security Notice */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg border border-green-200/50 dark:border-green-700/50">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold text-green-800 dark:text-green-200 sm:text-xs">{t("security.title")}</div>
                                <div className="mt-0.5 text-[11px] leading-tight text-green-600 dark:text-green-300 sm:text-xs">
                                    {t("security.description")}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile-Optimized Additional Info */}
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                        <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center mt-0.5 flex-shrink-0">
                                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                                <strong>{t("note.title")}:</strong> {t("note.description")}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default PaymentMethodsList