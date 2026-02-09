import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUpload from './ImageUpload';
import { renderWithProviders } from '~/test/testUtils';
import { message } from 'antd';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock FileReader globally
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,mockbase64',
    };

    global.FileReader = vi.fn(function(this: any) {
      return mockFileReader;
    }) as any;
  });

  it('should render upload button when no value provided', () => {
    renderWithProviders(<ImageUpload />);

    expect(screen.getByText('Upload Logo')).toBeInTheDocument();
  });

  it('should render cover upload button when type is cover', () => {
    renderWithProviders(<ImageUpload type="cover" />);

    expect(screen.getByText('Upload Cover')).toBeInTheDocument();
  });

  it('should display preview image when value is provided', () => {
    const imageUrl = 'https://example.com/image.jpg';
    renderWithProviders(<ImageUpload value={imageUrl} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', imageUrl);
  });

  it('should reject non-image files', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ImageUpload onChange={onChange} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('You can only upload JPG/PNG/WEBP files!');
    });
  });

  it('should reject files larger than 5MB', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ImageUpload onChange={onChange} />);

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Image must be smaller than 5MB!');
    });
  });

  it('should accept valid image files', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ImageUpload onChange={onChange} />);

    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(file);
    });
  });

  it('should update preview when value prop changes', () => {
    const { rerender } = renderWithProviders(<ImageUpload value="https://example.com/image1.jpg" />);

    let image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');

    rerender(<ImageUpload value="https://example.com/image2.jpg" />);

    image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('should accept PNG files', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ImageUpload onChange={onChange} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Should not show error for valid PNG
    expect(message.error).not.toHaveBeenCalled();
  });

  it('should accept WEBP files', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ImageUpload onChange={onChange} />);

    const file = new File(['image content'], 'test.webp', { type: 'image/webp' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Should not show error for valid WEBP
    expect(message.error).not.toHaveBeenCalled();
  });
});

