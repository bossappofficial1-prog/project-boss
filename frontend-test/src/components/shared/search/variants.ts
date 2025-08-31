import { cva } from 'class-variance-authority';

export const searchInputVariants = cva(
    'relative w-full rounded-md transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/30',
    {
        variants: {
            size: {
                sm: 'pl-8 pr-8 h-9 text-sm',
                md: 'pl-10 pr-10 h-11 text-base',
                lg: 'pl-12 pr-12 h-14 text-lg',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);

export const searchIconVariants = cva('absolute top-1/2 -translate-y-1/2 text-primary/70 z-10 transition-colors duration-200 group-hover:text-primary', {
    variants: {
        size: {
            sm: 'h-4 w-4 left-2.5',
            md: 'h-5 w-5 left-3',
            lg: 'h-6 w-6 left-4',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const clearButtonVariants = cva('absolute top-1/2 -translate-y-1/2 z-10 p-0 hover:bg-muted/50 transition-colors duration-200', {
    variants: {
        size: {
            sm: 'h-7 w-7 right-1',
            md: 'h-8 w-8 right-2',
            lg: 'h-9 w-9 right-3',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});