import * as React from 'react';
import { cn } from '../src/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Additional class names to merge onto the input element.
   */
  className?: string;
}

/**
 * shadcn/ui-style Input component.
 *
 * Figma reference: https://www.figma.com/design/v3rOFkEIIFlcTPLA991F1n/-shadcn-ui---Design-System--Community-?node-id=13-1589
 *
 * Design specs (node 13:1589):
 *  - Height:            40 px  → h-10
 *  - Horizontal padding: 12 px → px-3
 *  - Vertical padding:   8 px  → py-2
 *  - Border:            1 px solid zinc-200 → border border-zinc-200
 *  - Border radius:     6 px  → rounded-md
 *  - Font size:         14 px → text-sm
 *  - Placeholder color: zinc-400 → placeholder:text-zinc-400
 *  - Shadow:            sm (subtle elevation)
 *  - Focus ring:        2 px ring, 2 px offset → focus-visible:ring-2 focus-visible:ring-offset-2
 *  - Disabled:          opacity-50, not-allowed cursor
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Layout
          'flex h-10 w-full',
          // Shape
          'rounded-md',
          // Border
          'border border-zinc-200',
          // Background & text
          'bg-white px-3 py-2 text-sm text-zinc-950',
          // Shadow
          'shadow-sm',
          // Placeholder
          'placeholder:text-zinc-400',
          // File input resets
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950',
          // Focus ring
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Dark-mode variants
          'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';

export { Input };
