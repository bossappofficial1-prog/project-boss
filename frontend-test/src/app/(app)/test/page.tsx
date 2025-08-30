"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket-v2";

export default function TestPage() {
    const [messages, setMessages] = useState<string[]>([]);
    const { isConnected, emitEvent, onEvent } = useSocket();

    useEffect(() => {
        onEvent("orderEvent", (data) => {
            console.log("📩 Received update:", data);
            setMessages((prev) => [...prev, JSON.stringify(data)]);
        });
    }, [onEvent]);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold">Test Socket Page</h1>
            <p>Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</p>
            <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => emitEvent("order:update", "ord")}
            >
                Emit Event
            </button>

            <div className="mt-4 space-y-2">
                <h2 className="font-semibold">Messages:</h2>
                {messages.map((msg, idx) => (
                    <div key={idx} className="p-2 border rounded">
                        {msg}
                    </div>
                ))}
            </div>
        </div>
    );
}
