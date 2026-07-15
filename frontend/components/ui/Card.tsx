import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', className)}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-4 py-3 border-b border-gray-100', className)} {...props}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-4', className)} {...props}>
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('px-4 py-3 border-t border-gray-100 bg-gray-50', className)} {...props}>
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };