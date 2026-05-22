import React from 'react';

import type { CellRendererProps } from '../../../framework/cell-registry';
import { Text } from '../../../primitives/text/index';

/**
 * Text Cell — molecule that renders a plain-text value inside the Text primitive.
 *
 * Layer: lib/molecules/cells — a focused composition of a primitive serving one role
 * (the Text Cell renderer). Canonical name per CLAUDE.md §4.
 *
 * `value` is typed `unknown` because the cell-type registry receives it from the
 * generic row type at runtime; this molecule coerces to string so the Text primitive
 * always receives a string or empty string.
 *
 * Truncation: `truncate` class applied via the Text primitive wrapper so long values
 * are clipped with an ellipsis. This matches the ui-ux-expectations.md truncation
 * requirement for the Default truncation behavior of Text Cell.
 *
 * No React.memo — profiling must precede memoization (rerender-memo rule).
 */

// Kept for standalone testing and direct consumption where full props are unnecessary.
export interface TextCellProps {
  readonly value: unknown;
}

/**
 * TextCell accepts the full CellRendererProps shape so it is compatible with the
 * cell-registry dispatcher signature. `column` and `row` are destructured but
 * unused today — they are available for future Text-specific options (truncate vs
 * wrap, maxLines) that will live on TextColumnConfig.
 */
export function TextCell({ value }: TextCellProps | CellRendererProps): React.ReactElement {
  // Derive in render, not in an effect (rerender-derived-state-no-effect rule).
  const text = value == null ? '' : String(value);
  // truncate: Tailwind utility — overflow hidden + text-overflow: ellipsis + white-space: nowrap.
  return <Text className="truncate">{text}</Text>;
}
