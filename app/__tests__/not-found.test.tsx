import { render, screen } from '@testing-library/react';
import NotFoundPage from '../not-found';

describe('NotFoundPage', () => {
  it('renders the primary heading', () => {
    render(<NotFoundPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '찾으시는 페이지가 보이지 않아요' }),
    ).toBeInTheDocument();
  });

  it('links back to the home page', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/');
  });
});
