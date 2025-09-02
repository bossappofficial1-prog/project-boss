"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Facebook, MessageCircle, Mail, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ShareOutletProps {
    outlet: {
        id: string;
        name: string;
        address: string;
        image?: string;
    };
    children: React.ReactNode;
}

export function ShareOutlet({ outlet, children }: ShareOutletProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const { push: toast } = useToast();

    // Memoize share URL and text to avoid re-creating on each render
    const shareUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        try {
            return `${window.location.origin}/outlet/${outlet.id}`;
        } catch {
            return '';
        }
    }, [outlet.id]);

    const shareText = useMemo(() => `Lihat outlet ${outlet.name} di BOSS App`, [outlet.name]);

    const handleCopyLink = useCallback(async () => {
        if (!shareUrl) {
            toast({ title: 'Gagal menyalin', description: 'Link tidak tersedia' });
            return;
        }

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
            } else {
                // Fallback: create a temporary textarea
                const textarea = document.createElement('textarea');
                textarea.value = shareUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setCopied(true);
            toast({ title: 'Link tersalin!', description: 'Link outlet telah disalin ke clipboard' });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({ title: 'Gagal menyalin', description: 'Terjadi kesalahan saat menyalin link' });
        }
    }, [shareUrl, toast]);

    // Small helper for opening external windows safely
    const openExternal = useCallback((url: string) => window.open(url, '_blank', 'noopener,noreferrer'), []);

    const shareOptions = useMemo(() => ([
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => {
                const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
                openExternal(url);
            }
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600 hover:bg-blue-700',
            action: () => {
                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                openExternal(url);
            }
        },
        {
            name: 'Others',
            icon: ExternalLink,
            color: 'bg-purple-600 hover:bg-purple-700',
            action: async () => {
                if (typeof navigator !== 'undefined' && (navigator as any).share) {
                    try {
                        await (navigator as any).share({ title: shareText, text: `${outlet.name} - ${outlet.address}`, url: shareUrl });
                    } catch (error) {
                        // user cancelled or failed — swallow silently
                    }
                } else {
                    toast({ title: 'Fitur tidak tersedia', description: 'Browser Anda tidak mendukung fitur berbagi' });
                }
            }
        }
    ]), [shareText, shareUrl, outlet.address, outlet.name, openExternal, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Bagikan Outlet
                    </DialogTitle>
                    <DialogDescription>
                        Bagikan informasi outlet ini kepada teman dan keluarga
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-w-full">
                    {/* Outlet Preview */}
                    <div className="bg-muted rounded-lg p-3 overflow-hidden">
                        <h4 className="font-medium line-clamp-1">{outlet.name}</h4>
                        <span className="text-sm text-muted-foreground line-clamp-2 break-words">{outlet.address}</span>
                    </div>

                    {/* Copy Link */}
                    <div className="space-y-2 w-full">
                        <label className="text-sm font-medium">Link Outlet</label>
                        <div className="flex items-center gap-2 w-full">
                            {/* biar ikut lebar parent, tambahin flex-1 */}
                            <div className="bg-muted rounded-lg px-3 py-2 flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground truncate">{shareUrl.slice(0, 30) + "..."}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="flex-shrink-0"
                                aria-label={`Salin link ${outlet.name}`}
                                title={`Salin link ${outlet.name}`}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>


                    {/* Share Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bagikan melalui</label>
                        <div className="grid grid-cols-3 gap-2">
                            {shareOptions.map((option) => (
                                <Button
                                    key={option.name}
                                    variant="outline"
                                    className={`flex items-center gap-2 justify-start ${option.color} text-white border-0 px-4`}
                                    onClick={option.action}
                                >
                                    <option.icon className="w-4 h-4" />
                                    <span className="text-sm truncate">{option.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
