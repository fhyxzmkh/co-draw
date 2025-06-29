import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { Socket } from "socket.io-client";
import * as awarenessProtocol from "y-protocols/awareness";
import { UserInfo } from "@/stores/user-store";

export class YSocketIOProvider {
  public awareness: Awareness;

  constructor(
    private ydoc: Y.Doc,
    private documentId: string,
    private socket: Socket,
    private user: UserInfo, // 接收当前用户信息
  ) {
    this.awareness = new Awareness(ydoc);

    // 绑定事件处理器，注意 this 的指向
    this.awareness.on("update", this.handleLocalAwarenessUpdate);
    this.ydoc.on("update", this.handleLocalYdocUpdate);

    this.socket.on("doc:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.on("doc:update", this.handleRemoteYdocUpdate);
    this.socket.on("doc:state", this.handleRemoteYdocState);

    // 请求初始状态并广播自己的存在
    this.socket.emit("doc:load", { documentId });
    // 使用真实的用户信息设置本地状态
    this.awareness.setLocalStateField("user", {
      name: this.user.username,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    });
  }

  private handleLocalAwarenessUpdate = (
    { added, updated, removed }: any,
    origin: any,
  ) => {
    if (origin !== this) {
      const changedClients = added.concat(updated, removed);
      // 使用 `encodeAwarenessUpdate` 将状态编码为二进制
      const update = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        changedClients,
      );
      this.socket.emit("doc:awareness", {
        documentId: this.documentId,
        awarenessUpdate: update,
      });
    }
  };

  private handleLocalYdocUpdate = (update: Uint8Array, origin: any) => {
    if (origin !== this) {
      this.socket.emit("doc:update", { documentId: this.documentId, update });
    }
  };

  private handleRemoteAwarenessUpdate = (data: { awarenessUpdate: any }) => {
    // 应用二进制更新
    awarenessProtocol.applyAwarenessUpdate(
      this.awareness,
      new Uint8Array(data.awarenessUpdate),
      this,
    );
  };

  private handleRemoteYdocUpdate = (data: { update: any }) => {
    try {
      Y.applyUpdate(this.ydoc, new Uint8Array(data.update), this);
    } catch (error) {
      console.error("Failed to apply remote ydoc update:", error);
    }
  };

  private handleRemoteYdocState = (data: { state: any }) => {
    try {
      Y.applyUpdate(
        this.ydoc,
        new Uint8Array(data.state.data || data.state),
        this,
      );
    } catch (error) {
      console.error("Failed to apply initial ydoc state:", error);
    }
  };

  public disconnect = () => {
    this.socket.off("doc:awareness", this.handleRemoteAwarenessUpdate);
    this.socket.off("doc:update", this.handleRemoteYdocUpdate);
    this.socket.off("doc:state", this.handleRemoteYdocState);
    this.ydoc.off("update", this.handleLocalYdocUpdate);
    this.awareness.off("update", this.handleLocalAwarenessUpdate);
    this.awareness.destroy();
  };
}
