import { formatCurrency } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    highlight?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, highlight = false }) => {
    return (
        <div className={`p-4 rounded-md border transition-all ${highlight
            ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
            : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 shadow-sm'
            }`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{title}</span>
                {icon}
            </div>
            <p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {formatCurrency(value)}
            </p>
        </div>
    );
}