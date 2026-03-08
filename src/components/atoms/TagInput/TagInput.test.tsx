import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('renders existing tags as badges', () => {
    render(<TagInput tags={['仕事', '勉強']} onTagsChange={vi.fn()} />);
    expect(screen.getByText('仕事')).toBeInTheDocument();
    expect(screen.getByText('勉強')).toBeInTheDocument();
  });

  it('adds a tag when Enter is pressed', () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={[]} onTagsChange={onTagsChange} />);
    const input = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(input, { target: { value: '仕事' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagsChange).toHaveBeenCalledWith(['仕事']);
  });

  it('removes a tag when its remove button is clicked', () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={['仕事', '勉強']} onTagsChange={onTagsChange} />);
    fireEvent.click(screen.getByRole('button', { name: '仕事を削除' }));
    expect(onTagsChange).toHaveBeenCalledWith(['勉強']);
  });

  it('does not add duplicate tags', () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={['仕事']} onTagsChange={onTagsChange} />);
    const input = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(input, { target: { value: '仕事' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it('trims whitespace before adding a tag', () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={[]} onTagsChange={onTagsChange} />);
    const input = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(input, { target: { value: '  仕事  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagsChange).toHaveBeenCalledWith(['仕事']);
  });

  it('does not add tag when max count is reached', () => {
    const maxTags = Array.from({ length: 10 }, (_, i) => `tag${i}`);
    const onTagsChange = vi.fn();
    render(<TagInput tags={maxTags} onTagsChange={onTagsChange} />);
    const input = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(input, { target: { value: '新しいタグ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagsChange).not.toHaveBeenCalled();
  });

  it('does not add an over-length tag', () => {
    const onTagsChange = vi.fn();
    render(<TagInput tags={[]} onTagsChange={onTagsChange} />);
    const input = screen.getByPlaceholderText('タグを追加...');
    fireEvent.change(input, { target: { value: 'a'.repeat(21) } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onTagsChange).not.toHaveBeenCalled();
  });
});
