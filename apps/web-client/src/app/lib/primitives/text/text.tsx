import React from 'react';

/**
 * Text primitive — the minimal, indivisible building block for inline text content.
 *
 * Renders children inside a <span>. No styling or behaviour is applied here;
 * consuming molecules (Text Cell) and organisms own presentation decisions.
 *
 * Layer: lib/primitives — more fundamental than an atom; genuinely indivisible.
 */
export function Text({ children }: { readonly children?: React.ReactNode }): React.ReactElement {
  return <span>{children}</span>;
}
