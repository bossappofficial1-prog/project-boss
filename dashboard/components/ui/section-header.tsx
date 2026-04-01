import { ReactNode } from 'react';
import { Separator } from './separator';

type SectionHeaderProps = {
    title: string;
    description?: string;
    badge?: ReactNode;
    actions?: ReactNode;
};

export function SectionHeader({
    title,
    description,
    badge,
    actions,
}: SectionHeaderProps) {
    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {badge}
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>

                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
            <Separator />
        </>
    );
}