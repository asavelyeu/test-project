import React from 'react';

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
 * No React.memo — profiling must precede memoization (rerender-memo rule).
 */

export interface TextCellProps {
  readonly value: unknown;
}

export function TextCell({ value }: TextCellProps): React.ReactElement {
  // Derive in render, not in an effect (rerender-derived-state-no-effect rule).
  const text = value == null ? '' : String(value);
  return <Text>{text}</Text>;
}
