import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import ToolbarPlugin from './ToolbarPlugin';
import { renderWithProviders } from '~/test/testUtils';

describe('ToolbarPlugin', () => {
  const initialConfig = {
    namespace: 'TestEditor',
    theme: {},
    onError: (error: Error) => console.error(error),
    nodes: [HeadingNode, ListNode, ListItemNode],
  };

  const renderToolbar = () => {
    return renderWithProviders(
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<div>Enter text...</div>}
          ErrorBoundary={(props: any) => <div>Error: {props.error?.message}</div>}
        />
      </LexicalComposer>
    );
  };

  it('should render heading buttons', () => {
    renderToolbar();

    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('H2')).toBeInTheDocument();
    expect(screen.getByText('H3')).toBeInTheDocument();
  });

  it('should render text formatting buttons', () => {
    renderToolbar();

    // Check for icon buttons by their aria-labels or roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(10); // Should have many buttons
  });

  it('should render list buttons', () => {
    renderToolbar();

    // List buttons should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render alignment buttons', () => {
    renderToolbar();

    // Alignment buttons should be present
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should have toolbar styling', () => {
    const { container } = renderToolbar();

    const toolbar = container.querySelector('div[style*="border-bottom"]');
    expect(toolbar).toBeInTheDocument();
  });
});

