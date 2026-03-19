"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadApi, UploadMediaResult } from "@/lib/apis/upload";
import {
    X,
    Upload,
    Film,
    ImageIcon,
    Link2,
    GripVertical,
    Loader2,
    Plus,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export interface MediaItem {
    url: string;
    type: "IMAGE" | "VIDEO";
    source: "UPLOAD" | "EMBED";
    alt?: string;
    order: number;
    thumbnailUrl?: string;
}

type Props = {
    value: MediaItem[];
    onChange: (items: MediaItem[]) => void;
    maxItems?: number;
    onUploadingChange?: (loading: boolean) => void
};

const ACCEPTED_IMAGE = ".jpg,.jpeg,.png,.webp,.gif";
// const ACCEPTED_VIDEO = ".mp4,.webm,.mov";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
// const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export default function ServiceMediaUploader({
    value,
    onChange,
    maxItems = 5,
    onUploadingChange
}: Props) {
    const [uploading, setUploading] = useState(false);
    const [embedUrl, setEmbedUrl] = useState("");
    const [showEmbedInput, setShowEmbedInput] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const remaining = maxItems - value.length;

    const setUploadingState = (state: boolean) => {
        setUploading(state);
        onUploadingChange?.(state);
    };

    const handleFileUpload = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            const fileArray = Array.from(files).slice(0, remaining);
            if (fileArray.length === 0) {
                toast.error(`Maksimal ${maxItems} media`);
                return;
            }

            // Validate sizes
            for (const file of fileArray) {
                // const isVideo = file.type.startsWith("video/");
                const maxSize = MAX_IMAGE_SIZE;
                if (file.size > maxSize) {
                    toast.error(`${file.name}: Terlalu besar (maks ${"5MB"})`);
                    return;
                }
            }

            setUploadingState(true);
            try {
                const newItems: MediaItem[] = [];
                for (const file of fileArray) {
                    const result: UploadMediaResult = await uploadApi.uploadMedia(file);
                    newItems.push({
                        url: result.url,
                        type: result.mediaType,
                        source: "UPLOAD",
                        order: value.length + newItems.length,
                    });
                }
                onChange([...value, ...newItems]);
                toast.success(`${newItems.length} media berhasil diupload`);
            } catch (err: any) {
                toast.error(err?.response?.data?.message || "Gagal upload media");
            } finally {
                setUploadingState(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [value, onChange, remaining, maxItems],
    );

    const handleAddEmbed = useCallback(async () => {
        if (!embedUrl.trim()) return;

        const ytMatch = embedUrl.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        );
        const ttMatch = embedUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        const ttShortMatch = embedUrl.match(/(?:vt|vm)\.tiktok\.com\/[a-zA-Z0-9]+/);

        if (!ytMatch && !ttMatch && !ttShortMatch) {
            toast.error("URL tidak valid. Hanya YouTube atau TikTok yang didukung.");
            return;
        }

        let finalUrl = embedUrl;
        let thumbnailUrl: string | undefined;

        if (ytMatch) {
            const videoId = ytMatch[1];
            finalUrl = `https://www.youtube.com/embed/${videoId}`;
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (ttMatch) {
            const videoId = ttMatch[1];
            finalUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
        } else if (ttShortMatch) {
            try {
                const oembedRes = await fetch(
                    `https://www.tiktok.com/oembed?url=${encodeURIComponent(embedUrl)}`,
                );
                if (!oembedRes.ok) throw new Error("oEmbed request failed");
                const oembedData = await oembedRes.json();
                thumbnailUrl = oembedData.thumbnail_url;
                const citeMatch = oembedData.html?.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
                if (citeMatch) {
                    finalUrl = `https://www.tiktok.com/embed/v2/${citeMatch[1]}`;
                } else {
                    finalUrl = embedUrl;
                }
            } catch {
                toast.error("Gagal memproses URL TikTok. Coba gunakan URL lengkap.");
                return;
            }
        }

        const newItem: MediaItem = {
            url: finalUrl,
            type: "VIDEO",
            source: "EMBED",
            order: value.length,
            thumbnailUrl,
        };

        onChange([...value, newItem]);
        setEmbedUrl("");
        setShowEmbedInput(false);
        toast.success("Video embed berhasil ditambahkan");
    }, [embedUrl, value, onChange]);

    const handleRemove = useCallback(
        async (idx: number) => {
            const item = value[idx];
            // Delete uploaded file from server
            if (item.source === "UPLOAD") {
                try {
                    await uploadApi.deleteByUrl(item.url);
                } catch {
                    // Ignore
                }
            }
            const newItems = value
                .filter((_, i) => i !== idx)
                .map((item, i) => ({ ...item, order: i }));
            onChange(newItems);
        },
        [value, onChange],
    );

    // Drag & drop reorder
    const handleDragStart = (idx: number) => setDraggedIndex(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        setDragOverIndex(idx);
    };
    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const items = [...value];
            const [moved] = items.splice(draggedIndex, 1);
            items.splice(dragOverIndex, 0, moved);
            onChange(items.map((item, i) => ({ ...item, order: i })));
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const getPreviewUrl = (item: MediaItem) => {
        if (item.type === "VIDEO" && item.thumbnailUrl) return item.thumbnailUrl;
        if (item.type === "IMAGE") return item.url;
        return null;
    };

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">
                Media Gallery ({value.length}/{maxItems})
            </Label>

            {/* Media grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {value.map((item, idx) => {
                        const previewUrl = getPreviewUrl(item);
                        return (
                            <div
                                key={item.url + idx}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`relative aspect-[9/16] rounded-md overflow-hidden border-2 group cursor-grab active:cursor-grabbing transition-all ${dragOverIndex === idx
                                    ? "border-primary scale-105"
                                    : "border-border hover:border-primary/40"
                                    }`}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt={item.alt || `Media ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <Film className="w-6 h-6 text-white/60" />
                                    </div>
                                )}

                                {/* Type badge */}
                                <div className="absolute top-1 left-1 flex items-center gap-0.5">
                                    {item.type === "VIDEO" ? (
                                        <span className="bg-blue-500/80 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <Film className="w-2.5 h-2.5" />
                                            {item.source === "EMBED" ? "Embed" : "Video"}
                                        </span>
                                    ) : (
                                        <span className="bg-green-500/80 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                            <ImageIcon className="w-2.5 h-2.5" />
                                            Foto
                                        </span>
                                    )}
                                </div>

                                {/* Drag handle */}
                                <div className="absolute top-1 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(idx);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                {/* Order number */}
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    {idx + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add buttons */}
            {remaining > 0 && (
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={`${ACCEPTED_IMAGE}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        {uploading ? "Uploading..." : "Upload Foto/Video"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmbedInput(!showEmbedInput)}
                        className="gap-1.5"
                    >
                        <Link2 className="w-4 h-4" />
                        Embed Video
                    </Button>
                </div>
            )}

            {/* Embed URL input */}
            {showEmbedInput && remaining > 0 && (
                <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            URL YouTube atau TikTok (termasuk vt.tiktok.com)
                        </Label>
                        <Input
                            placeholder="https://youtube.com/watch?v=... atau https://vt.tiktok.com/..."
                            value={embedUrl}
                            onChange={(e) => setEmbedUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmbed())}
                        />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddEmbed}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah
                    </Button>
                </div>
            )}

            {/* Info */}
            {remaining <= 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Batas maksimal {maxItems} media tercapai
                </p>
            )}

            <p className="text-xs text-muted-foreground">
                Foto: maks 5MB (jpg, png, webp) &bull; Video: maks 50MB (mp4, webm, mov) &bull;
                Drag untuk mengurutkan
            </p>
        </div>
    );
}
