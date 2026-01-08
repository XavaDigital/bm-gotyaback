import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  modules?: any;
  formats?: string[];
}

/**
 * React 19 compatible Quill editor wrapper
 * Uses vanilla Quill.js with useRef instead of findDOMNode
 * Properly integrated with Ant Design Form
 */
export const QuillEditor: React.FC<QuillEditorProps> = ({
  value = "",
  onChange,
  placeholder = "",
  style,
  modules,
  formats,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Quill once
  useEffect(() => {
    const container = editorRef.current;
    if (!container) {
      return;
    }

    // If Quill is already initialized, reuse it
    if (quillRef.current) {
      return;
    }

    // Create Quill instance directly on the container
    const quill = new Quill(container, {
      theme: "snow",
      placeholder,
      modules: modules || {
        toolbar: [
          ["bold", "italic", "underline"],
          ["link"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ header: [1, 2, 3, false] }],
          ["clean"],
        ],
      },
      formats: formats || [
        "bold",
        "italic",
        "underline",
        "link",
        "list",
        "header",
      ],
    });

    quillRef.current = quill;

    // Set initial value
    if (value) {
      isUpdatingRef.current = true;
      quill.clipboard.dangerouslyPasteHTML(value);
      isUpdatingRef.current = false;
    }

    // Handle text changes
    quill.on("text-change", () => {
      if (isUpdatingRef.current) {
        return;
      }

      const html = quill.root.innerHTML;
      const text = quill.getText().trim();

      // Call onChange with the HTML content using the ref
      // Only treat as empty if there's no actual text content
      if (onChangeRef.current) {
        if (text.length === 0) {
          onChangeRef.current("");
        } else {
          onChangeRef.current(html);
        }
      }
    });

    // Cleanup - DON'T clear the ref or innerHTML to prevent double initialization
    return () => {
      // In Strict Mode, React will call this, then re-run the effect
      // We keep quillRef.current so the re-run will skip initialization
    };
  }, []); // Only run once on mount

  // Update content when value prop changes (from form)
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;
    const currentContent = quill.root.innerHTML;

    // Normalize empty content
    const normalizedCurrent = currentContent === "<p><br></p>" ? "" : currentContent;
    const normalizedValue = value || "";

    // Only update if the value is different from current content
    if (normalizedValue !== normalizedCurrent) {
      isUpdatingRef.current = true;

      if (normalizedValue) {
        quill.clipboard.dangerouslyPasteHTML(normalizedValue);
      } else {
        quill.setText("");
      }

      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div style={{ backgroundColor: "white", ...style }}>
      <div ref={editorRef} />
    </div>
  );
};

