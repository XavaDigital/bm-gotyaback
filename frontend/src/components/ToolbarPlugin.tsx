import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $getNearestNodeOfType } from "@lexical/utils";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { Button, Space, Divider } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
} from "@ant-design/icons";

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatHeading = (headingSize: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getTopLevelElementOrThrow();
        const headingNode = $createHeadingNode(headingSize);
        element.replace(headingNode);
      }
    });
  };

  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid #d9d9d9",
        backgroundColor: "#fafafa",
        display: "flex",
        gap: "4px",
        flexWrap: "wrap",
      }}
    >
      <Space.Compact>
        <Button
          size="small"
          type={blockType === "h1" ? "primary" : "default"}
          onClick={() => formatHeading("h1")}
        >
          H1
        </Button>
        <Button
          size="small"
          type={blockType === "h2" ? "primary" : "default"}
          onClick={() => formatHeading("h2")}
        >
          H2
        </Button>
        <Button
          size="small"
          type={blockType === "h3" ? "primary" : "default"}
          onClick={() => formatHeading("h3")}
        >
          H3
        </Button>
      </Space.Compact>

      <Divider type="vertical" style={{ margin: "0 4px" }} />

      <Space.Compact>
        <Button
          size="small"
          type={isBold ? "primary" : "default"}
          icon={<BoldOutlined />}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        />
        <Button
          size="small"
          type={isItalic ? "primary" : "default"}
          icon={<ItalicOutlined />}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        />
        <Button
          size="small"
          type={isUnderline ? "primary" : "default"}
          icon={<UnderlineOutlined />}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
          }
        />
        <Button
          size="small"
          type={isStrikethrough ? "primary" : "default"}
          icon={<StrikethroughOutlined />}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
        />
      </Space.Compact>

      <Divider type="vertical" style={{ margin: "0 4px" }} />

      <Space.Compact>
        <Button
          size="small"
          icon={<UnorderedListOutlined />}
          onClick={() => {
            if (blockType !== "ul") {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
        />
        <Button
          size="small"
          icon={<OrderedListOutlined />}
          onClick={() => {
            if (blockType !== "ol") {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            } else {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            }
          }}
        />
      </Space.Compact>

      <Divider type="vertical" style={{ margin: "0 4px" }} />

      <Space.Compact>
        <Button
          size="small"
          icon={<AlignLeftOutlined />}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        />
        <Button
          size="small"
          icon={<AlignCenterOutlined />}
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
          }
        />
        <Button
          size="small"
          icon={<AlignRightOutlined />}
          onClick={() =>
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
          }
        />
      </Space.Compact>
    </div>
  );
};

export default ToolbarPlugin;
