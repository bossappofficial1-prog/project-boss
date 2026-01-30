interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = "#10b981", width = 80, height = 30 }) => {
    if (!data || data.length < 2) return <div className="w-20 h-[30px] bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="drop-shadow-sm"
            />
        </svg>
    );
};