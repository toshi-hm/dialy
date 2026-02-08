import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SaveStatusIndicator } from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  it('renders saving status', () => {
    render(<SaveStatusIndicator status="saving" />);

    expect(screen.getByRole('status')).toHaveTextContent('保存中...');
  });

  it('renders saved status', () => {
    render(<SaveStatusIndicator status="saved" />);

    expect(screen.getByRole('status')).toHaveTextContent('✓ 保存しました');
  });

  it('renders error status with retry message', () => {
    render(<SaveStatusIndicator status="error" errorMessage="保存に失敗しました" />);

    expect(screen.getByRole('status')).toHaveTextContent('⚠ 保存に失敗しました');
  });
});
