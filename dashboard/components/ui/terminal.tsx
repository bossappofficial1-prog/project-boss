import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, Copy, Pause, Play, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

type LogEntry = {
    timestamp: string;
    level: 'INFO' | 'ERROR' | 'WARN' | 'SUCCESS';
    message: string;
};

export default function LiveServerLogs({ logs = [], isConnected = true, onClear }: { logs: string[], isConnected?: boolean, onClear?: () => void }) {
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const parseLog = (logStr: string): LogEntry => {
        const regex = /^(\d{2}:\d{2}:\d{2})\s\[(ERROR|INFO|WARN|SUCCESS|DEBUG|SYSTEM)\]\s(.*)/;
        const match = logStr.match(regex);

        if (match) {
            return {
                timestamp: match[1],
                level: match[2] as any,
                message: match[3]
            };
        }
        return { timestamp: new Date().toLocaleTimeString(), level: 'INFO', message: logStr };
    };

    useEffect(() => {
        if (autoScroll && !isPaused && logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll, isPaused]);

    const handleScroll = () => {
        if (!logsContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isAtBottom);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(logs.join('\n'));
    };

    // Helper warna berdasarkan level
    const getLevelStyle = (level: string) => {
        switch (level) {
            case 'ERROR': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'WARN': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'SYSTEM': return 'text-orange-400 bg-amber-orange/10 border-orange-400/20';
            case 'SUCCESS': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

    return (
        <Card className="h-[500px] lg:h-full py-0 gap-0 flex flex-col bg-[#0F172A] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-800">
            <div className="px-4 py-3 border-b border-slate-800 bg-[#020617] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${isConnected ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <Terminal className={`h-4 w-4 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Live Server Logs</h3>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {isConnected ? 'System Online' : 'Disconnected'}
                        </p>
                    </div>
                </div>

                {/* UX: Action Buttons */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? "Resume logs" : "Pause logs"}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                    >
                        {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        onClick={handleCopy}
                        title="Copy all logs"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={onClear}
                        title="Clear logs"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={logsContainerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 p-4 font-mono text-[12px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
                >
                    {logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                            <Terminal className="h-8 w-8 mb-2" />
                            <span>No logs received yet...</span>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {logs.map((rawLog, i) => {
                                const log = parseLog(rawLog);
                                return (
                                    <div
                                        key={i}
                                        className="group flex items-start gap-2 px-2 py-1 hover:bg-slate-800/50 rounded-sm transition-colors break-all leading-tight"
                                    >
                                        <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                                        <span className={`text-[10px] font-bold px-1.5 rounded border ${getLevelStyle(log.level)} shrink-0 w-[60px] text-center`}>
                                            {log.level}
                                        </span>
                                        <span className={`${log.level === 'ERROR' ? 'text-red-500' : (log.level === 'SUCCESS' ? 'text-green-300' : 'text-slate-300')}`}>
                                            {log.message}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Cursor Animation */}
                            {!isPaused && isConnected && (
                                <div className="mt-2 pl-2 flex items-center gap-2 text-emerald-500/50">
                                    <span className="animate-pulse">_</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* UX: Tombol "Scroll to Bottom" jika user scroll ke atas */}
                {!autoScroll && (
                    <button
                        onClick={() => {
                            setAutoScroll(true);
                            logsContainerRef.current?.scrollTo({ top: logsContainerRef.current.scrollHeight, behavior: 'smooth' });
                        }}
                        className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg transition-all animate-bounce"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </button>
                )}
            </div>
        </Card>
    );
}