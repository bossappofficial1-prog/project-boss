import { Order } from "@/services/order";
import { PaymentMethod } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Building2, ChevronRight, QrCode, Shield, Wallet } from "lucide-react";
import { DivXScroll } from "../shared/DivXScroll";
import { Button } from "../ui/button";
import { ImageRender } from "../shared/Image";
import { LoadingState } from "../Base";

const PaymentMethodsList: React.FC<{
    onSelectPayment: (method: PaymentMethod) => void;
    selectedPayment: PaymentMethod
}> = ({ onSelectPayment, selectedPayment }) => {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'qris' | 'va'>('all');
    const { data: paymentMethods, isLoading } = useQuery({
        queryKey: ["payment-methods"],
        queryFn: Order.getPaymentMethodList
    });


    const filteredMethods = selectedCategory === 'all'
        ? paymentMethods
        : paymentMethods?.filter(method => method.type === selectedCategory);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Pilih Metode Pembayaran
                </CardTitle>

                {/* Category Tabs */}
                <DivXScroll className='gap-2'>
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="h-8"
                    >
                        Semua
                    </Button>
                    <Button
                        variant={selectedCategory === 'qris' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('qris')}
                        className="h-8"
                    >
                        <QrCode className="w-3 h-3 mr-1" />
                        QRIS
                    </Button>
                    <Button
                        variant={selectedCategory === 'va' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('va')}
                        className="h-8"
                    >
                        <Building2 className="w-3 h-3 mr-1" />
                        Bank
                    </Button>
                </DivXScroll>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-2">
                    {isLoading
                        ? <LoadingState />
                        : filteredMethods?.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => onSelectPayment(method)}
                                className={`w-full p-4 border rounded-xl hover:border-primary/50 hover:bg-accent/30 ${selectedPayment && selectedPayment.id === method.id && "border-primary bg-primary/5"} transition-all text-left group hover:shadow-sm`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 overflow-hidden h-10 rounded-full bg-muted/50 flex items-center justify-center text-lg">
                                            <ImageRender
                                                src={method.image_url}
                                                alt={method.name}
                                                className="w-fit h-fit object-fill"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium group-hover:text-primary transition-colors">
                                                {method.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {method.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 mt-4 p-3 bg-green-50/15 rounded-lg border border-green-200/15">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                        Pembayaran aman dan terlindungi
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

export default PaymentMethodsList