"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { useEffect, useState } from "react";
import { useYjsSocket } from "@/hooks/use-yjs-socket";

interface DocumentEditorProps {
  documentId: string;
  isEditable: boolean;
}

const DocumentEditor = ({ documentId, isEditable }: DocumentEditorProps) => {
  // 为每个组件实例创建并持有一个独立的 ydoc
  const [ydoc] = useState(() => new Y.Doc());

  // 调用 Hook，传入 ydoc 和 documentId
  useYjsSocket(ydoc, documentId);

  const editor = useEditor({
    immediatelyRender: false,
    editable: isEditable,
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({
        document: ydoc, // 将编辑器绑定到这个组件实例的 ydoc
      }),
    ],
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable);
    }
  }, [isEditable, editor]);

  return <EditorContent editor={editor} />;
};

export default DocumentEditor;
