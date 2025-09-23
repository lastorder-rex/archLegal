import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline';
};

const baseClasses =
  'inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variantClasses =
      variant === 'primary'
        ? 'bg-primary text-primary-foreground hover:opacity-90 focus-visible:ring-primary'
        : 'border border-primary bg-background text-primary hover:bg-primary hover:bg-opacity-10 focus-visible:ring-primary focus-visible:ring-opacity-40 border-opacity-40';

    return <button ref={ref} className={clsx(baseClasses, variantClasses, className)} {...props} />;
  }
);

Button.displayName = 'Button';
