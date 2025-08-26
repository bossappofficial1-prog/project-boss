'use client'

import { useState } from "react";
import Image from "next/image";

export function ImageRender(
    { src, alt, className, sizes }:
        { src: string, alt: string, className: string, sizes?: string }) {
    const [imgSrc, setImgSrc] = useState(src || "/assets/images/default-image.png");

    return (
        <Image
            fill
            src={imgSrc}
            alt={alt}
            className={` ${className}`}
            sizes={sizes || "(max-width: 768px) 100vw, 600px"}
            onError={() => setImgSrc("/assets/images/default-image.png")}
            loading="lazy"
        />
    );
}
