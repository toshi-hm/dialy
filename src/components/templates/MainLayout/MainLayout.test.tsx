import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MainLayout } from './MainLayout';

describe('MainLayout', () => {
  it('renders header and children', () => {
    render(
      <MainLayout>
        <p>content</p>
      </MainLayout>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
