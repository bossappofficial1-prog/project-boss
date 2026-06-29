import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/assets/logo/logo-bossapp.svg"
          alt="BOSS"
          width={120}
          height={120}
          priority
          className="animate-bounce-soft"
        />
      </div>

      <style>{`
                @keyframes bounce-soft {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.08); opacity: 0.85; }
                }
                .animate-bounce-soft {
                    animation: bounce-soft 1.2s ease-in-out infinite;
                }
            `}</style>
    </div>
  );
}
