"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  MoreVertical,
  Crown,
  Edit,
  Trash2,
  Eye,
  Info,
  UserPlus,
} from "lucide-react";
import { axios_instance } from "@/config/configuration";
import { toast } from "sonner";
import { useSocketStore } from "@/stores/socket-store";

// --- 类型定义 ---

// 权限类型
export type Permission = "owner" | "editor" | "viewer";

export type ResourceType = "board" | "document";

// 协作者接口
interface Collaborator {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  role: Permission;
}

// 组件属性
interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceType: ResourceType;
  currentUserPermission: Permission;
  currentUserId: string;
}

// --- 配置 ---

// 权限配置
export const PERMISSION_CONFIG: Record<
  Permission,
  { label: string; description: string; color: string; icon: React.ElementType }
> = {
  owner: {
    label: "创建者",
    description: "拥有所有权限",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Crown,
  },
  editor: {
    label: "编辑者",
    description: "可以编辑文件内容",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Edit,
  },
  viewer: {
    label: "查看者",
    description: "只能查看文件内容",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Eye,
  },
};

export default function CollaboratorsDialog({
  open,
  onOpenChange,
  resourceId,
  resourceType,
  currentUserPermission,
  currentUserId,
}: CollaboratorsDialogProps) {
  // --- 状态管理 ---
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [invitePermission, setInvitePermission] =
    useState<Permission>("viewer");
  const [deletingCollaborator, setDeletingCollaborator] =
    useState<Collaborator | null>(null);

  const onlineUserIds = useSocketStore((state) => state.onlineUserIds);
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (open && socket) {
      socket.emit("presence:get", resourceId);
    }
  }, [open, socket, resourceId]);

  // 检查当前用户是否有管理权限
  const canManage = useMemo(
    () => currentUserPermission === "owner",
    [currentUserPermission],
  );

  useEffect(() => {
    // 拉取协作者列表
    const getCollaborators = async () => {
      if (resourceType === "board") {
        const response = await axios_instance.get(
          `/boards/participants?boardId=${resourceId}`,
        );

        setCollaborators(response.data);
      }
      if (resourceType === "document") {
        const response = await axios_instance.get(
          `/documents/participants?documentId=${resourceId}`,
        );

        setCollaborators(response.data);
      }
    };

    if (open) {
      getCollaborators();
    }
  }, [open, resourceId, resourceType]);

  // 发送邀请
  const sendInvite = async () => {
    try {
      const response = await axios_instance.post(
        `/messages/invitation/create`,
        {
          fromUserId: currentUserId,
          toUsername: inviteUsername,
          resourceId: resourceId,
          permission: invitePermission,
          resourceType: resourceType,
        },
      );

      if (response.status === 201) {
        toast.success("邀请成功，等待对方确认");
      }
    } catch (error: any) {
      toast.error(error.response.data.message);
      console.error(error);
    } finally {
      setInviteUsername("");
    }
  };

  // 更新协作者权限
  const updateCollaboratorPermission = async (
    collaboratorId: string,
    newRole: Permission,
  ) => {
    if (resourceType === "board") {
      const response = await axios_instance.post("/boards/role/update", {
        resourceId: resourceId,
        userId: collaboratorId,
        role: newRole,
      });

      if (response.status === 201) {
        toast.success("权限更新成功");
        setCollaborators(
          collaborators.map((c) =>
            c.id === collaboratorId ? { ...c, role: newRole } : c,
          ),
        );
      } else {
        toast.error("权限更新失败，请稍后重试");
      }
    }

    if (resourceType === "document") {
      const response = await axios_instance.post("/documents/role/update", {
        resourceId: resourceId,
        userId: collaboratorId,
        role: newRole,
      });

      if (response.status === 201) {
        toast.success("权限更新成功");
        setCollaborators(
          collaborators.map((c) =>
            c.id === collaboratorId ? { ...c, role: newRole } : c,
          ),
        );
      } else {
        toast.error("权限更新失败，请稍后重试");
      }
    }
  };

  // 移除协作者
  const removeCollaborator = async (collaboratorId: string) => {
    if (resourceType === "board") {
      const response = await axios_instance.post("/boards/role/delete", {
        resourceId: resourceId,
        userId: collaboratorId,
      });

      if (response.status !== 201) {
        toast.error("移除协作者失败，请稍后重试");
        return;
      }

      toast.success("该协作者已成功移除");
      setCollaborators(collaborators.filter((c) => c.id !== collaboratorId));
      setDeletingCollaborator(null); // 关闭确认对话框
    }

    if (resourceType === "document") {
      const response = await axios_instance.post("/documents/role/delete", {
        resourceId: resourceId,
        userId: collaboratorId,
      });

      if (response.status !== 201) {
        toast.error("移除协作者失败，请稍后重试");
        return;
      }

      toast.success("该协作者已成功移除");
      setCollaborators(collaborators.filter((c) => c.id !== collaboratorId));
      setDeletingCollaborator(null); // 关闭确认对话框
    }
  };

  // 格式化加入时间
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // --- UI 渲染 ---

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              协作者管理
            </DialogTitle>
            <DialogDescription>管理文件的协作者和权限设置。</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* 邀请部分，仅管理员可见 */}
            {canManage && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                <h3 className="font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  邀请新成员
                </h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="输入对方的用户名"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="flex-grow"
                  />
                  <Select
                    value={invitePermission}
                    onValueChange={(value: Permission) =>
                      setInvitePermission(value)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">编辑者</SelectItem>
                      <SelectItem value="viewer">查看者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={sendInvite}
                  disabled={!inviteUsername.trim()}
                  className="w-full"
                >
                  发送邀请
                </Button>
              </div>
            )}

            {/* 协作者列表 */}
            <div className="space-y-2">
              <h3 className="font-medium px-1">
                协作者列表 ({collaborators.length})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                {collaborators.map((collaborator) => {
                  const isCurrentUser = collaborator.id === currentUserId;
                  const isOwner = collaborator.role === "owner";
                  const PermissionIcon =
                    PERMISSION_CONFIG[collaborator.role].icon;
                  const isOnline = onlineUserIds.includes(collaborator.id);

                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">
                          {collaborator.username}
                          {isCurrentUser && (
                            <span className="text-sm font-normal text-gray-500 ml-1">
                              (你)
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-gray-500">
                          加入于: {formatJoinDate(collaborator.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                            {collaborator.username.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                              isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                            title={isOnline ? "在线" : "离线"}
                          />
                        </div>

                        <Badge
                          variant="outline"
                          className={`${PERMISSION_CONFIG[collaborator.role].color}`}
                        >
                          <PermissionIcon className="h-3 w-3 mr-1.5" />
                          {PERMISSION_CONFIG[collaborator.role].label}
                        </Badge>

                        {canManage && !isCurrentUser && !isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateCollaboratorPermission(
                                    collaborator.id,
                                    "editor",
                                  )
                                }
                                disabled={collaborator.role === "editor"}
                              >
                                <Edit className="mr-2 h-4 w-4" /> 设为编辑者
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateCollaboratorPermission(
                                    collaborator.id,
                                    "viewer",
                                  )
                                }
                                disabled={collaborator.role === "viewer"}
                              >
                                <Eye className="mr-2 h-4 w-4" /> 设为查看者
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeletingCollaborator(collaborator)
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> 移除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!canManage && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  你没有管理权限，只能查看协作者列表。
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deletingCollaborator}
        onOpenChange={() => setDeletingCollaborator(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除协作者吗？</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要将 <strong>{deletingCollaborator?.username}</strong>{" "}
              从协作者中移除吗？ 此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingCollaborator &&
                removeCollaborator(deletingCollaborator.id)
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              确认移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
