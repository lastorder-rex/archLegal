import { forwardRef } from 'react';
import { Button } from './button';

type CTAButtonProps = React.ComponentProps<typeof Button> & {
  tone?: 'primary' | 'secondary';
};

const toneClasses: Record<'primary' | 'secondary', string> = {
  primary: '',
  secondary: 'border-opacity-60'
};

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ className, tone = 'primary', ...props }, ref) => (
    <Button
      ref={ref}
      className={`${toneClasses[tone]} ${className ?? ''}`.trim()}
      variant={tone === 'primary' ? 'primary' : 'outline'}
      {...props}
    />
  )
);

CTAButton.displayName = 'CTAButton';
