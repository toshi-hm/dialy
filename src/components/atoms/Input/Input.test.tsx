import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />);

    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<Input aria-label="diary-input" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'diary-input' }), {
      target: { value: 'hello' },
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies error state styles and aria-invalid', () => {
    render(<Input aria-label="error-input" hasError />);

    const input = screen.getByRole('textbox', { name: 'error-input' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-600');
  });
});
