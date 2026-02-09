import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QuillEditor } from './QuillEditor';

// Mock Quill
let mockQuill: any;

vi.mock('quill', () => ({
  default: vi.fn(function(this: any) {
    return mockQuill;
  }),
}));

describe('QuillEditor', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockQuill = {
      root: {
        innerHTML: '',
      },
      clipboard: {
        dangerouslyPasteHTML: vi.fn(),
      },
      setText: vi.fn(),
      getText: vi.fn(() => ''),
      on: vi.fn(),
    };
    vi.clearAllMocks();
  });
  it('should render editor container', () => {
    const { container } = render(<QuillEditor />);

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should initialize Quill with default modules', async () => {
    const Quill = (await import('quill')).default;
    render(<QuillEditor placeholder="Enter text..." />);

    await waitFor(() => {
      expect(Quill).toHaveBeenCalled();
    });
  });

  it('should set initial value', async () => {
    render(<QuillEditor value="<p>Initial content</p>" />);

    await waitFor(() => {
      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        '<p>Initial content</p>'
      );
    });
  });

  it('should call onChange when text changes', async () => {
    const onChange = vi.fn();
    mockQuill.getText = vi.fn(() => 'Some text');
    mockQuill.root.innerHTML = '<p>Some text</p>';

    render(<QuillEditor onChange={onChange} />);

    // Wait for Quill to be initialized and get the text-change handler
    await waitFor(() => {
      expect(mockQuill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
    });

    // Get and call the text-change handler
    const textChangeHandler = mockQuill.on.mock.calls.find(
      (call) => call[0] === 'text-change'
    )?.[1];

    textChangeHandler();

    expect(onChange).toHaveBeenCalledWith('<p>Some text</p>');
  });

  it('should call onChange with empty string when text is empty', async () => {
    const onChange = vi.fn();
    mockQuill.getText = vi.fn(() => '');
    mockQuill.root.innerHTML = '<p><br></p>';

    render(<QuillEditor onChange={onChange} />);

    // Wait for Quill to be initialized and get the text-change handler
    await waitFor(() => {
      expect(mockQuill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
    });

    // Get and call the text-change handler
    const textChangeHandler = mockQuill.on.mock.calls.find(
      (call) => call[0] === 'text-change'
    )?.[1];

    textChangeHandler();

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should apply custom styles', () => {
    const { container } = render(
      <QuillEditor style={{ border: '1px solid red' }} />
    );

    // The outer div should exist and have inline styles
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toBeInTheDocument();
    // Check that the style attribute contains the custom border
    expect(outerDiv.getAttribute('style')).toContain('border');
  });

  it('should have white background by default', () => {
    const { container } = render(<QuillEditor />);

    // The outer div has backgroundColor: white (rendered as rgb(255, 255, 255))
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  });

  it('should accept custom modules', async () => {
    const Quill = (await import('quill')).default;
    const customModules = {
      toolbar: [['bold', 'italic']],
    };

    render(<QuillEditor modules={customModules} />);

    await waitFor(() => {
      expect(Quill).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          modules: customModules,
        })
      );
    });
  });

  it('should accept custom formats', async () => {
    const Quill = (await import('quill')).default;
    const customFormats = ['bold', 'italic'];

    render(<QuillEditor formats={customFormats} />);

    await waitFor(() => {
      expect(Quill).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          formats: customFormats,
        })
      );
    });
  });
});

