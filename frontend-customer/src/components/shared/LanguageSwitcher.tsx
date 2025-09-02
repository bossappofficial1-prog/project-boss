"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocale } from '@/hooks/useI18n';
import { SelectOption } from './SelectOption';
import { LANGUAGES, LanguageType } from '@/constants';

export default function LanguageSwitcher() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentLocale = useLocale() as LanguageType;

    const handleLanguageChange = (newLocale: string) => {
        // Create new URLSearchParams
        const params = new URLSearchParams(searchParams);
        params.set('locale', newLocale);

        document.cookie = `locale=${newLocale}; path=/;`
        // Navigate to the same path with new locale parameter
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center w-full space-x-2">
            <SelectOption
                value={currentLocale}
                onValueChange={handleLanguageChange}
                options={LANGUAGES?.map(lang => ({
                    value: lang.key,
                    label: lang.label
                }))}
            />
        </div>
    );
}