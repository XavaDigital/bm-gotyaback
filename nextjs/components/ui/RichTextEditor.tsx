'use client';

import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import type { LexicalEditor } from 'lexical';
import ToolbarPlugin from './ToolbarPlugin';
import '@/styles/richtext.css';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Plugin to set initial HTML content
function InitialContentPlugin({ html }: { html?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = React.useState(true);

  useEffect(() => {
    if (html && isFirstRender) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
      setIsFirstRender(false);
    }
  }, [editor, html, isFirstRender]);

  return null;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  readOnly = false,
}) => {
  const initialConfig = {
    namespace: 'RichTextEditor',
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        ul: 'editor-list-ul',
        ol: 'editor-list-ol',
        listitem: 'editor-listitem',
      },
      link: 'editor-link',
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
    editable: !readOnly,
  };

  const handleChange = (editorState: any, editor: LexicalEditor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      onChange?.(htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        {!readOnly && <ToolbarPlugin />}
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                style={{
                  minHeight: '150px',
                  padding: '10px',
                  outline: 'none',
                }}
              />
            }
            placeholder={
              <div className="editor-placeholder">{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          {onChange && <OnChangePlugin onChange={handleChange} />}
          <InitialContentPlugin html={value} />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default RichTextEditor;

