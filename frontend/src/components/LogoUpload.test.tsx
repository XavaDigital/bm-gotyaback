import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import LogoUpload from './LogoUpload';
import { renderWithProviders } from '~/test/testUtils';
import { message } from 'antd';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
    },
  };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('LogoUpload', () => {
  let mockImage: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Image globally
    mockImage = {
      width: 300,
      height: 300,
      onload: null as any,
      onerror: null as any,
      src: '',
    };

    (window as any).Image = vi.fn(function(this: any) {
      // Automatically trigger onload after a short delay
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 0);
      return mockImage;
    });
  });

  it('should render dragger when no file is uploaded', () => {
    renderWithProviders(<LogoUpload />);

    expect(screen.getByText(/Click or drag logo file to this area to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPG, or SVG/i)).toBeInTheDocument();
  });

  it('should display custom max size in hint', () => {
    renderWithProviders(<LogoUpload maxSize={5} />);

    expect(screen.getByText(/Max 5MB/i)).toBeInTheDocument();
  });

  it('should display custom min dimensions in hint', () => {
    renderWithProviders(<LogoUpload minDimensions={{ width: 300, height: 300 }} />);

    expect(screen.getByText(/Min 300x300px/i)).toBeInTheDocument();
  });

  it('should reject invalid file types', async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUpload onChange={onChange} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('You can only upload PNG, JPG, or SVG files!');
    });
  });

  it('should reject files larger than max size', async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUpload maxSize={2} />);

    // Create a file larger than 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.png', {
      type: 'image/png',
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Image must be smaller than 2MB!');
    });
  });

  it('should accept PNG files', async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUpload onChange={onChange} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });

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

  it('should accept SVG files without dimension check', async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUpload onChange={onChange} />);

    const file = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
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

  it('should reject images smaller than min dimensions', async () => {
    const onChange = vi.fn();

    // Mock Image with small dimensions for this test
    const mockSmallImage = {
      width: 100,
      height: 100,
      onload: null as any,
      onerror: null as any,
      src: '',
    };

    (window as any).Image = vi.fn(function(this: any) {
      setTimeout(() => {
        if (mockSmallImage.onload) {
          mockSmallImage.onload();
        }
      }, 0);
      return mockSmallImage;
    });

    renderWithProviders(<LogoUpload minDimensions={{ width: 200, height: 200 }} onChange={onChange} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Image must be at least 200x200px!');
    });
  });

  it('should warn for non-square images', async () => {
    const onChange = vi.fn();

    // Mock Image with non-square dimensions for this test
    const mockNonSquareImage = {
      width: 300,
      height: 200,
      onload: null as any,
      onerror: null as any,
      src: '',
    };

    (window as any).Image = vi.fn(function(this: any) {
      setTimeout(() => {
        if (mockNonSquareImage.onload) {
          mockNonSquareImage.onload();
        }
      }, 0);
      return mockNonSquareImage;
    });

    renderWithProviders(<LogoUpload onChange={onChange} />);

    const file = new File(['image content'], 'test.png', { type: 'image/png' });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(message.warning).toHaveBeenCalledWith(
        'For best results, use a square image (same width and height)'
      );
    });
  });
});

