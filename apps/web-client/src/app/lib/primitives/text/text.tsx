import React from 'react';

/**
 * Text primitive — the minimal, indivisible building block for inline text content.
 *
 * Renders children inside a <span>. Styling is the responsibility of consuming
 * molecules (Text Cell) and organisms — only `className` is forwarded so that
 * presentation classes (e.g., `truncate`, `wrap`) can be applied by the caller
 * without this primitive owning any opinion about layout.
 *
 * Layer: lib/primitives — more fundamental than an atom; genuinely indivisible.
 */
export interface TextProps {
  readonly children?: React.ReactNode;
  /**
   * Optional Tailwind utility classes forwarded to the <span>.
   * The primitive itself applies no classes; callers own presentation.
   */
  readonly className?: string;
}

export function Text({ children, className }: TextProps): React.ReactElement {
  return <span className={className}>{children}</span>;
}
