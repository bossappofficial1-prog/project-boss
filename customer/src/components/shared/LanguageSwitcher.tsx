"use client"

import { useRouter } from 'next/navigation';
import { useLocale, setLocale } from '@/hooks/useI18n';
import { SelectOption } from './SelectOption';
import { LANGUAGES, LanguageType } from '@/constants';

export default function LanguageSwitcher() {
    const router = useRouter();
    const currentLocale = useLocale() as LanguageType;

    const handleLanguageChange = (newLocale: string) => {
        setLocale(newLocale as LanguageType);
        router.refresh();
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