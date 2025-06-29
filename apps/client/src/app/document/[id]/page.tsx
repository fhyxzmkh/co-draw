"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect } from "react"; // 1. 引入 useEffect
import { useSocketStore } from "@/stores/socket-store";

// 动态导入编辑器组件
const DocumentEditor = dynamic(
  () => import("@/components/common/document-editor"),
  {
    ssr: false,
    loading: () => <p>正在加载编辑器...</p>,
  },
);

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as string;

  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    // 确保 documentId 存在时才执行连接
    if (documentId) {
      console.log(`Page mounted. Connecting to document: ${documentId}`);
      // 组件挂载时，调用 connect action 发起连接
      connect(documentId, "document");
    }

    // 组件卸载时，useEffect 返回的这个清理函数会被调用
    return () => {
      console.log(
        `Page unmounting. Disconnecting from document: ${documentId}`,
      );
      // 调用 disconnect action 断开连接，这非常重要！
      disconnect();
    };

    // 依赖项数组确保 effect 只在需要时运行
  }, [documentId, connect, disconnect]);

  // 在 documentId 准备好之前，可以显示加载状态
  if (!documentId) {
    return <p>正在加载文档ID...</p>;
  }

  return (
    <div>
      <DocumentEditor documentId={documentId} />
    </div>
  );
}
