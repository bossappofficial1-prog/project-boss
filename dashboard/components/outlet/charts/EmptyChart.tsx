import { ChartAreaIcon, LucideIcon } from "lucide-react";

export function EmptyChart({
    icon: Icon,
    label
}: {
    label?: string,
    icon?: LucideIcon
}) {
    return (
        <div className='h-72 w-full flex justify-center items-center'>
            <div className='flex flex-col items-center space-y-2'>
                {
                    Icon ?
                        <Icon className='w-12 h-12 text-muted-foreground' />
                        : <ChartAreaIcon className='w-12 h-12 text-muted-foreground' />
                }
                <span className='text-muted-foreground text-sm'>
                    {label ? label : 'Belum Ada Data'}
                </span>
            </div>
        </div>
    )
}