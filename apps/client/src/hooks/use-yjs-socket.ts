import { useEffect } from "react";
import * as Y from "yjs";
import { useSocketStore } from "@/stores/socket-store";

// 这个 Hook 接收 ydoc 实例和文档ID
export const useYjsSocket = (ydoc: Y.Doc, documentId: string) => {
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket || !ydoc || !documentId) {
      return;
    }

    console.log(`Setting up Yjs listeners for document: ${documentId}`);

    // =================================================================
    // 发送本地更新 & 接收远程更新
    // =================================================================

    const handleYdocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== socket.id) {
        // console.log("Sending local update to server");
        socket.emit("doc:update", { documentId, update });
      }
    };

    const handleSocketDocUpdate = (data: {
      documentId: string;
      update: any;
    }) => {
      if (data.documentId === documentId) {
        console.log(
          "Applying remote update from server. Data received:",
          data.update,
        );
        try {
          // 将接收到的数据明确转换为 Uint8Array
          const updateBuffer = new Uint8Array(data.update);
          Y.applyUpdate(ydoc, updateBuffer, socket.id);
        } catch (error) {
          console.error("Failed to apply remote update:", error);
        }
      }
    };

    ydoc.on("update", handleYdocUpdate);
    socket.on("doc:update", handleSocketDocUpdate);

    // =================================================================
    // 加载初始状态
    // =================================================================

    const handleSocketDocState = (data: { documentId: string; state: any }) => {
      if (data.documentId === documentId && data.state) {
        console.log(
          "Applying initial state from server. Data received:",
          data.state,
        );
        try {
          // 将接收到的数据明确转换为 Uint8Array
          // Node.js Buffer 在序列化后可能变成 { type: 'Buffer', data: [...] }
          // 所以我们做一个兼容性处理
          const stateBuffer = new Uint8Array(data.state.data || data.state);
          Y.applyUpdate(ydoc, stateBuffer, socket.id);
        } catch (error) {
          console.error("Failed to apply initial state:", error);
        }
      }
    };

    socket.on("doc:state", handleSocketDocState);
    socket.emit("doc:load", { documentId }); // 发送对象以匹配后端

    // =================================================================
    // 清理函数
    // =================================================================
    return () => {
      console.log(`Cleaning up Yjs listeners for document: ${documentId}`);
      socket.off("doc:state", handleSocketDocState);
      socket.off("doc:update", handleSocketDocUpdate);
      ydoc.off("update", handleYdocUpdate);
    };
  }, [socket, ydoc, documentId]);
};
