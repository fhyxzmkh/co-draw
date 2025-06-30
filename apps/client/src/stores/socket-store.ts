import { io, Socket } from "socket.io-client";
import { create } from "zustand/react";
import { ResourceType } from "@/components/common/collaborators-dialog";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
}

interface SocketActions {
  connect: (resourceId: string, resourceType: ResourceType) => void;
  disconnect: () => void;
}

type SocketStore = SocketState & SocketActions;

export const useSocketStore = create<SocketStore>((set, get) => ({
  // 初始状态
  socket: null,
  isConnected: false,

  // --- ACTIONS ---

  // 动作：连接到服务器
  connect: (resourceId: string, resourceType: ResourceType) => {
    // 防止重复连接
    if (get().socket) {
      return;
    }

    const newSocket = io("http://localhost:6788", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Zustand: Connected to WebSocket server!", newSocket.id);
      set({ socket: newSocket, isConnected: true });

      newSocket.emit("joinRoom", { resourceId: resourceId });

      if (resourceType === "board") {
        newSocket.emit("board:load", { boardId: resourceId });
      } else if (resourceType === "document") {
        newSocket.emit("doc:load", { documentId: resourceId });
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Zustand: Disconnected from WebSocket server.");
      set({ socket: null, isConnected: false });
    });

    newSocket.on("joinedRoom", (roomId) => {
      console.log(`Successfully joined room: ${roomId}`);
    });
  },

  // 动作：断开连接
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
