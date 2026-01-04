import React from "react";

interface GoogleIconProps {
    className?: string;
}

export const GoogleIcon: React.FC<GoogleIconProps> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
    >
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.35 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.55c0-1.57-.14-3.13-.41-4.65H24v9.02h12.4c-.54 2.91-2.18 5.51-4.66 7.24l7.34 5.69c4.3-3.96 6.99-9.79 6.99-17.3z" />
        <path fill="#FBBC05" d="M10.54 28.41A14.5 14.5 0 0 1 9.5 24c0-1.52.25-3 .7-4.41l-7.98-6.19A23.85 23.85 0 0 0 0 24c0 3.86.91 7.51 2.56 10.6l7.98-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.94-2.13 15.92-5.78l-7.34-5.69A14.38 14.38 0 0 1 24 38.5c-6.26 0-11.57-3.85-13.46-9.41l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);
