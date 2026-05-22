import React from 'react';
import { render } from '@testing-library/react';

import { TextCell } from './text-cell';

describe('TextCell', () => {
  it('US-09: renders a string value as text', () => {
    const { getByText } = render(<TextCell value="Hello" />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('US-09: renders a numeric value coerced to string', () => {
    const { getByText } = render(<TextCell value={42} />);
    expect(getByText('42')).toBeTruthy();
  });

  it('US-09: renders empty string for null value', () => {
    const { container } = render(<TextCell value={null} />);
    // span should be present but contain empty text
    expect(container.querySelector('span')).toBeTruthy();
    expect(container.querySelector('span')?.textContent).toBe('');
  });

  it('US-09: renders empty string for undefined value', () => {
    const { container } = render(<TextCell value={undefined} />);
    expect(container.querySelector('span')?.textContent).toBe('');
  });

  it('US-09: renders value through the Text primitive (span)', () => {
    const { container } = render(<TextCell value="via-primitive" />);
    // Value must be inside a <span> from the Text primitive.
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('via-primitive');
  });

  // -------------------------------------------------------------------------
  // Truncation (US-09 + ui-ux-expectations.md truncation requirement)
  // -------------------------------------------------------------------------

  it('US-09: applies truncate Tailwind class to the Text primitive span', () => {
    const { container } = render(<TextCell value="A very long text value" />);
    const span = container.querySelector('span');
    // The `truncate` class enables overflow:hidden + text-overflow:ellipsis + white-space:nowrap.
    expect(span?.className).toContain('truncate');
  });
});
