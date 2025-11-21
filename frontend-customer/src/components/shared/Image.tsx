'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import { resolveCustomerImageUrl, IMAGE_PLACEHOLDER } from "@/lib/url";

export function ImageRender(
    { src,
        alt,
        className,
        sizes,
        priority,
        onLoad,
        ref
    }:
        {
            src: string,
            alt: string,
            className?: string,
            sizes?: string,
            priority?: boolean,
            ref?: any,
            onLoad?: () => void
        }) {
    const [imgSrc, setImgSrc] = useState(resolveCustomerImageUrl(src));

    useEffect(() => {
        setImgSrc(resolveCustomerImageUrl(src));
    }, [src]);

    return (
        <Image
            width={600}
            height={400}
            src={imgSrc}
            alt={alt}
            className={` ${className}`}
            sizes={sizes || "(max-width: 768px) 100vw, 600px"}
            onError={() => setImgSrc(IMAGE_PLACEHOLDER)}
            onLoad={onLoad}
            {...(ref && { ref })}
            {...(priority ? { priority } : { loading: "lazy" })}
        />
    );
}

export default ImageRender;
