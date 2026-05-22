import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the Students column header from the demo dataset', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('First Name').length > 0).toBeTruthy();
  });

  it('should render a student cell value from the demo dataset', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('Alice').length > 0).toBeTruthy();
  });

  it('should render the Users column header from the demo dataset', () => {
    const { getAllByText } = render(<App />);
    expect(getAllByText('Username').length > 0).toBeTruthy();
  });
});
