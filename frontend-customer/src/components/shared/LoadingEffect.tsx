type LoadingEffectProps = {
    /**
     * If true, the component renders without the absolute positioning used for the
     * bottom nav (so it can be placed centered in a full-screen overlay).
     */
    standalone?: boolean;
};

export default function LoadingEffect({ standalone = false }: LoadingEffectProps) {
    const outerClass = standalone
        ? 'pointer-events-none relative flex items-center justify-center'
        : 'pointer-events-none absolute -top-7 left-1/2 z-60 -translate-x-1/2';

    return (
        <div className={outerClass}>
            <div className="relative w-14 h-14">
                {/* outer expanding ring */}
                <span className={`absolute inset-0 rounded-full ${'bg-[#b22222]/30 animate-ping'}`} />
                {/* center circle with image */}
                <span className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full shadow-xl ${'bg-[#b22222] animate-pulse'}`}>
                    <img
                        src={'/assets/logo/logo-color.svg'}
                        alt="center"
                        // filter membuat semua warna logo menjadi putih sehingga kontras dengan lingkaran merah
                        className="w-7 h-7 filter brightness-0 invert"
                    />
                </span>
            </div>
        </div>
    );
}