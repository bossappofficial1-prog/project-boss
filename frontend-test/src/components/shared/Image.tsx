'use client'

import { useState } from "react";
import Image from "next/image";

export function ImageRender(
    { src,
        alt,
        className,
        sizes,
        priority
    }:
        {
            src: string,
            alt: string,
            className?: string,
            sizes?: string,
            priority?: boolean
        }) {
    const [imgSrc, setImgSrc] = useState(src || "/assets/images/default-image.png");

    return (
        <Image
            // fill
            width={1000}
            height={1000}
            src={imgSrc}
            alt={alt}
            className={` ${className}`}
            sizes={sizes || "(max-width: 768px) 100vw, 600px"}
            onError={() => setImgSrc("/assets/images/default-image.png")}
            {...(priority ? { priority } : { loading: "lazy" })}
        />
    );
}
