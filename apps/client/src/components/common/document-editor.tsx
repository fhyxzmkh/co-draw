"use client";

import { EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { useEffect, useState } from "react";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { EditorToolbar } from "@/components/common/editor-toolbar";
import { useUserStore } from "@/stores/user-store";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";
import { useSocketStore } from "@/stores/socket-store";
import { YSocketIOProvider } from "@/hooks/y-socketio-provider";
import { Heading } from "@tiptap/extension-heading";
import { FontSize } from "@/lib/font-size";

interface DocumentEditorProps {
  documentId: string;
  isEditable: boolean;
}

const DocumentEditor = ({ documentId, isEditable }: DocumentEditorProps) => {
  // 将 editor 实例也放入 state 中，初始为 null
  const [editor, setEditor] = useState<Editor | null>(null);
  const { socket, isConnected } = useSocketStore();
  const { userInfo } = useUserStore();

  // 用一个 useEffect 来管理 editor 和 provider 的生命周期
  useEffect(() => {
    if (!socket || !isConnected || !userInfo || !documentId) {
      return;
    }

    // --- 初始化 ---
    const ydoc = new Y.Doc();
    const provider = new YSocketIOProvider(ydoc, documentId, socket, userInfo);

    // --- 创建编辑器实例 ---
    const newEditor = new Editor({
      // 现在可以安全地传入 provider
      editable: isEditable,
      editorProps: {
        attributes: {
          class: "focus:outline-none p-2",
        },
      },
      extensions: [
        StarterKit.configure({ history: false }),
        TextStyle,
        Color,
        FontFamily,
        Underline,
        FontSize,
        Heading.configure({
          levels: [1, 2, 3],
        }),
        Highlight.configure({ multicolor: true }),
        Collaboration.configure({ document: ydoc }),
        CollaborationCursor.configure({
          provider: provider,
          // user 信息现在由 provider 内部处理
        }),
      ],
    });

    // 将创建好的 editor 实例存入 state
    setEditor(newEditor);

    // --- 清理函数 ---
    return () => {
      // 销毁 editor 和 provider，断开连接，释放所有资源
      newEditor.destroy();
      provider.disconnect();
    };

    // 依赖项确保只在必要时重建 editor 和 provider
  }, [socket, isConnected, userInfo, documentId, isEditable]);

  return (
    <div className="relative w-full h-full border border-gray-200 rounded-md">
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
};

export default DocumentEditor;
