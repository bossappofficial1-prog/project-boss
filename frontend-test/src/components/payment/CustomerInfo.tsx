import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type CustomerInfoProps = {
    name: string,
    phone: string
}

export function CustomerInfo({ name, phone }: CustomerInfoProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Nama</span>
                        <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">No. Telepon</span>
                        <span className="font-medium">{phone}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}