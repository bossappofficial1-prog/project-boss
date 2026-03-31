'use client';

import { useEffect, useRef, useState } from "react";
import ImageRender from "./Image";

export function ImageColorThief(props: {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
}) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [gradient, setGradient] = useState<string>("transparent");

    // Fungsi ringan untuk mengekstrak 2 warna dominan menggunakan Canvas
    const extractDominantColors = (imgEl: HTMLImageElement): [number[], number[]] => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Fallback warna jika gagal
        if (!ctx) return [[255, 255, 255], [200, 200, 200]];

        // Perkecil gambar drastis (64x64) agar proses looping pixel super cepat
        const MAX_DIMENSION = 64;
        const scale = Math.min(MAX_DIMENSION / imgEl.width, MAX_DIMENSION / imgEl.height);
        const width = Math.max(1, Math.floor(imgEl.width * scale));
        const height = Math.max(1, Math.floor(imgEl.height * scale));

        canvas.width = width;
        canvas.height = height;

        // Gambar ke canvas dengan background putih untuk transparan (jika PNG)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(imgEl, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height).data;

        const colorCounts: Record<string, number> = {};
        const rgbValues: Record<string, number[]> = {};

        // Looping setiap pixel (tiap pixel punya 4 nilai: R, G, B, A)
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            // Abaikan pixel yang transparan
            if (a < 128) continue;

            // Kuantisasi warna (mengelompokkan warna mirip agar tidak terlalu banyak variasi)
            const step = 24;
            const qR = Math.round(r / step) * step;
            const qG = Math.round(g / step) * step;
            const qB = Math.round(b / step) * step;

            const key = `${qR},${qG},${qB}`;

            if (colorCounts[key]) {
                colorCounts[key]++;
            } else {
                colorCounts[key] = 1;
                rgbValues[key] = [r, g, b]; // Simpan warna aslinya
            }
        }

        // Urutkan warna dari yang paling banyak muncul
        const sortedColors = Object.keys(colorCounts).sort(
            (a, b) => colorCounts[b] - colorCounts[a]
        );

        let color1 = [255, 255, 255];
        let color2 = [200, 200, 200];

        if (sortedColors.length > 0) {
            color1 = rgbValues[sortedColors[0]];

            // Cari warna kedua yang agak berbeda dari warna pertama
            let foundSecond = false;
            for (let i = 1; i < sortedColors.length; i++) {
                const candidate = rgbValues[sortedColors[i]];
                // Cek jarak warna (agar gradien tidak flat 1 warna saja)
                const dist = Math.abs(candidate[0] - color1[0]) +
                    Math.abs(candidate[1] - color1[1]) +
                    Math.abs(candidate[2] - color1[2]);

                if (dist > 60) {
                    color2 = candidate;
                    foundSecond = true;
                    break;
                }
            }
            // Jika gambarnya cuma 1 warna solid, samakan saja color2 dengan color1
            if (!foundSecond) color2 = color1;
        }

        return [color1, color2];
    };

    useEffect(() => {
        if (!props.src) return;

        // Membuat objek Image baru di memory agar lebih aman dari isu CORS & ref React
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = props.src;

        img.onload = () => {
            const [dominant1, dominant2] = extractDominantColors(img);
            setGradient(`linear-gradient(135deg, rgb(${dominant1.join(",")}), rgb(${dominant2.join(",")}))`);
        };
    }, [props.src]);

    return (
        <div
            className="w-full h-full relative overflow-hidden transition-colors duration-700"
            style={{ background: gradient }}
        >
            <ImageRender
                {...props}
                ref={imgRef}
                src={props.src}
                alt={props.alt}
                className={`absolute inset-0 w-full h-full object-cover ${props.className || ''}`}
            />
        </div>
    );
}