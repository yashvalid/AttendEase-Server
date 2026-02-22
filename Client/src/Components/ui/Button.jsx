import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    children,
    disabled,
    ...props
}, ref) => {

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow active:scale-[0.98]',
        secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow active:scale-[0.98]',
        outline: 'bg-transparent border border-gray-200 text-gray-900 hover:bg-gray-50 active:scale-[0.98]',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow active:scale-[0.98]',
        link: 'text-primary-600 underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-2',
    };

    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 select-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export { Button };
