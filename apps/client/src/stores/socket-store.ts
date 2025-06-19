import { io, Socket } from "socket.io-client";
import { create } from "zustand/react";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  receivedMessages: any[];
}

interface SocketActions {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  addMessage: (data: any) => void; // 用于内部更新消息列表
}

type SocketStore = SocketState & SocketActions;

export const useSocketStore = create<SocketStore>((set, get) => ({
  // 初始状态
  socket: null,
  isConnected: false,
  receivedMessages: [],

  // --- ACTIONS ---

  // 动作：连接到服务器
  connect: () => {
    // 防止重复连接
    if (get().socket) {
      return;
    }

    const newSocket = io("http://localhost:6788"); // NestJS 服务器地址

    newSocket.on("connect", () => {
      console.log("Zustand: Connected to WebSocket server!", newSocket.id);
      set({ socket: newSocket, isConnected: true });
    });

    newSocket.on("disconnect", () => {
      console.log("Zustand: Disconnected from WebSocket server.");
      set({ socket: null, isConnected: false });
    });

    // 监听我们自定义的 'messageToClient' 事件
    newSocket.on("messageToClient", (data) => {
      get().addMessage(data); // 调用内部 action 来更新消息列表
    });

    // 这里可以监听其他来自服务器的事件...
  },

  // 动作：断开连接
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // 动作：发送消息
  sendMessage: (message: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit("messageToServer", { message });
    }
  },

  // 内部动作：添加新消息到列表
  addMessage: (data: any) => {
    set((state) => ({
      receivedMessages: [...state.receivedMessages, data],
    }));
  },
}));
