"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/ui/back';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
            <div className="w-full max-w-md p-6 bg-[var(--surface)] rounded-lg shadow">
                <div className="mb-4">
                    <BackButton />
                </div>
                <h1 className="text-xl font-semibold mb-2">Login</h1>
                <p className="text-sm text-gray-500 mb-4">Sign in to your account. (UI only)</p>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input placeholder="email@domain.com" type="email" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <Input placeholder="Your password" type="password" />
                    </div>
                    <Button className="w-full">Sign in</Button>

                    <div className="flex items-center gap-3 my-2">
                        <div className="flex-grow border-t" />
                        <div className="text-xs text-gray-400">or</div>
                        <div className="flex-grow border-t" />
                    </div>

                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" className="inline-block">
                            <path fill="#EA4335" d="M24 9.5c3.9 0 7.2 1.3 9.9 3.6l7.4-7.4C36.6 1.8 30.6 0 24 0 14.7 0 6.9 4.9 2.9 12.1l8.6 6.7C13.9 13.1 18.5 9.5 24 9.5z" />
                            <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.8c-.6 3.1-2.6 5.7-5.5 7.3l8.6 6.7C43.6 38.4 46.5 31.9 46.5 24.5z" />
                            <path fill="#4A90E2" d="M10.9 28.8A14.6 14.6 0 0 1 9 24.5c0-1.3.2-2.6.5-3.8L2.9 13.9C1 16.7 0 20.4 0 24.5c0 4.1 1 7.8 2.9 10.6l8-6.3z" />
                            <path fill="#FBBC05" d="M24 48c6.6 0 12.6-2.2 17.4-5.9l-8.6-6.7c-2.4 1.6-5.4 2.5-8.8 2.5-5.6 0-10.3-3.7-12-8.8l-8.6 6.7C6.9 43.1 14.7 48 24 48z" />
                        </svg>
                        Continue with Google
                    </Button>
                </form>
            </div>
        </div>
    )
}
