import { io, Socket } from "socket.io-client";
import { create } from "zustand/react";
import { ResourceType } from "@/components/common/collaborators-dialog";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;

  onlineUserIds: string[];
}

interface SocketActions {
  connect: (resourceId: string, resourceType: ResourceType) => void;
  disconnect: () => void;

  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
}

type SocketStore = SocketState & SocketActions;

export const useSocketStore = create<SocketStore>((set, get) => ({
  // 初始状态
  socket: null,
  isConnected: false,
  onlineUserIds: [],

  // --- ACTIONS ---

  // 动作：连接到服务器
  connect: (resourceId: string, resourceType: ResourceType) => {
    // 防止重复连接
    if (get().socket) {
      return;
    }

    const newSocket = io("http://localhost:9961", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Zustand: Connected to WebSocket server!", newSocket.id);
      set({ socket: newSocket, isConnected: true, onlineUserIds: [] });

      newSocket.emit("subscribe", { resourceId: resourceId });

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

    newSocket.on("subscribed", (roomId) => {
      console.log(`Successfully joined room: ${roomId}`);
    });

    newSocket.on("presence:state", (data: { userIds: string[] }) => {
      console.log(`Current online users in room:`);
      console.log(data);
      get().setOnlineUsers(data.userIds);
    });

    // 监听新用户加入
    newSocket.on("user:joined", (data: { user: { id: string } }) => {
      console.log(`User joined: ${data.user.id}`);
      get().addOnlineUser(data.user.id);
    });

    // 监听用户离开
    newSocket.on("user:left", (data: { userId: string }) => {
      console.log(`User left: ${data.userId}`);
      get().removeOnlineUser(data.userId);
    });
  },

  // 动作：断开连接
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUserIds: [] });
    }
  },

  setOnlineUsers: (userIds: string[]) => set({ onlineUserIds: userIds }),

  addOnlineUser: (userId: string) =>
    set((state) => ({
      onlineUserIds: [...new Set([...state.onlineUserIds, userId])],
    })),

  removeOnlineUser: (userId: string) =>
    set((state) => ({
      onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
    })),
}));
