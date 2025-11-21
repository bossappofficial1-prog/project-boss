'use client';

import { useEffect, useRef, useState } from "react";
import ColorThief from "colorthief";
import ImageRender from "./Image";

export function ImageColorThief(props: {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
}) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [gradient, setGradient] = useState("");

    const extractColorWithFallback = (image: HTMLImageElement) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gambar PNG di atas background
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imgData = new Image();
        imgData.src = canvas.toDataURL();

        return imgData;
    };

    const handleGradientBg = () => {
        const img = imgRef.current;
        if (!img) return;

        img.crossOrigin = "anonymous";

        img.onload = () => {
            const processedImage = extractColorWithFallback(img);
            if (!processedImage) return;

            processedImage.onload = () => {
                const colorThief = new ColorThief();

                const dominant = colorThief.getColor(processedImage);
                const palette = colorThief.getPalette(processedImage, 5);

                const secondColor = palette[1] || dominant;

                const gradientCSS = `linear-gradient(135deg, rgb(${dominant.join(
                    ","
                )}), rgb(${secondColor.join(",")}))`;

                setGradient(gradientCSS);
            };
        };
    };

    useEffect(handleGradientBg, []);

    return (
        <div
            className="w-full h-full rounded-md shadow-md flex items-center justify-center"
            style={{ background: gradient }}
        >
            <ImageRender
                {...props}
                ref={imgRef}
                src={props.src}
                alt={props.alt}
                className={props.className}
            />
        </div>
    );
}
