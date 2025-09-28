import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
};

const baseClasses =
  'inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const variantClasses =
      variant === 'primary'
        ? 'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary'
        : 'border border-primary bg-background text-primary hover:bg-primary hover:bg-opacity-10 focus-visible:ring-primary focus-visible:ring-opacity-40 border-opacity-40';

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-base',
    }[size];

    const baseClassesWithoutSize = baseClasses.replace('px-4 py-2', '');

    return (
      <button
        ref={ref}
        className={clsx(baseClassesWithoutSize, sizeClasses, variantClasses, className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
