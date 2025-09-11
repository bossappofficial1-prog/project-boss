'use client'

import { useState } from "react";
import Image from "next/image";

export function ImageRender(
    { src,
        alt,
        className,
        sizes,
        priority,
        onLoad
    }:
        {
            src: string,
            alt: string,
            className?: string,
            sizes?: string,
            priority?: boolean,
            onLoad?: () => void
        }) {
    const [imgSrc, setImgSrc] = useState(src || "/assets/images/default-image.png");

    // Use smaller default dimensions and lazy loading by default to avoid
    // blocking LCP. Consumers can pass `priority` explicitly when needed.
    return (
        <Image
            width={600}
            height={400}
            src={imgSrc}
            alt={alt}
            className={` ${className}`}
            sizes={sizes || "(max-width: 768px) 100vw, 600px"}
            onError={() => setImgSrc("/assets/images/default-image.png")}
            onLoad={onLoad}
            {...(priority ? { priority } : { loading: "lazy" })}
        />
    );
}

export default ImageRender;
