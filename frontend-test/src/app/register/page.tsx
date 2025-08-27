"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
            <div className="w-full max-w-md p-6 bg-[var(--surface)] rounded-lg shadow">
                <h1 className="text-xl font-semibold mb-4">Register Business</h1>
                <p className="text-sm text-gray-500 mb-4">Register your business (UI only).</p>
                <div className="space-y-3">
                    <Input placeholder="Business name" />
                    <Input placeholder="Business phone" />
                    <Input placeholder="Website (optional)" />
                    <Button className="w-full">Start registration</Button>
                    <div className="border-t my-3" />
                    <Button variant="outline" className="w-full">Continue with Google</Button>
                </div>
            </div>
        </div>
    )
}
