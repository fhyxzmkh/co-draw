"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  MoreVertical,
  Crown,
  Edit,
  Trash2,
  Copy,
  Link,
  Mail,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from "lucide-react";

// 权限类型
type Permission = "owner" | "admin" | "editor" | "viewer";

// 协作者状态
type CollaboratorStatus = "online" | "offline" | "pending";

// 协作者接口
interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permission: Permission;
  status: CollaboratorStatus;
  joinedAt: string;
  lastActive?: string;
}

// 组件属性
interface CollaboratorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whiteboardId: string;
  currentUserPermission: Permission;
  currentUserId: string;
}

// 权限配置
const PERMISSION_CONFIG = {
  owner: {
    label: "创建者",
    description: "拥有所有权限",
    color: "bg-yellow-100 text-yellow-800",
    icon: Crown,
  },
  admin: {
    label: "管理员",
    description: "可以管理协作者和编辑内容",
    color: "bg-purple-100 text-purple-800",
    icon: Shield,
  },
  editor: {
    label: "编辑者",
    description: "可以编辑文件内容",
    color: "bg-blue-100 text-blue-800",
    icon: Edit,
  },
  viewer: {
    label: "查看者",
    description: "只能查看文件内容",
    color: "bg-gray-100 text-gray-800",
    icon: Eye,
  },
};

// 状态配置
const STATUS_CONFIG = {
  online: {
    label: "在线",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  offline: {
    label: "离线",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
  },
  pending: {
    label: "待加入",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
};

// 模拟协作者数据
const mockCollaborators: Collaborator[] = [
  {
    id: "1",
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    permission: "owner",
    status: "online",
    joinedAt: "2024-01-01",
    lastActive: "刚刚",
  },
  {
    id: "2",
    name: "李四",
    email: "lisi@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    permission: "admin",
    status: "online",
    joinedAt: "2024-01-05",
    lastActive: "5分钟前",
  },
  {
    id: "3",
    name: "王五",
    email: "wangwu@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    permission: "editor",
    status: "offline",
    joinedAt: "2024-01-10",
    lastActive: "2小时前",
  },
  {
    id: "4",
    name: "赵六",
    email: "zhaoliu@example.com",
    permission: "viewer",
    status: "pending",
    joinedAt: "2024-01-15",
  },
];

export default function CollaboratorsDialog({
  open,
  onOpenChange,
  whiteboardId,
  currentUserPermission,
  currentUserId,
}: CollaboratorsDialogProps) {
  const [collaborators, setCollaborators] =
    useState<Collaborator[]>(mockCollaborators);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] =
    useState<Permission>("viewer");
  const [deletingCollaborator, setDeletingCollaborator] =
    useState<Collaborator | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  // 检查当前用户是否有管理权限
  const canManage =
    currentUserPermission === "owner" || currentUserPermission === "admin";

  // 生成邀请链接
  const generateInviteLink = () => {
    const link = `${window.location.origin}/whiteboard/${whiteboardId}/invite?token=${Math.random().toString(36).substring(7)}`;
    setInviteLink(link);
  };

  // 复制邀请链接
  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      // 这里可以添加复制成功的提示
    }
  };

  // 发送邮件邀请
  const sendEmailInvite = () => {
    if (!inviteEmail.trim()) return;

    // 模拟发送邀请
    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      permission: invitePermission,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setCollaborators([...collaborators, newCollaborator]);
    setInviteEmail("");
    setShowInviteSuccess(true);
    setTimeout(() => setShowInviteSuccess(false), 3000);
  };

  // 更新协作者权限
  const updateCollaboratorPermission = (
    collaboratorId: string,
    newPermission: Permission,
  ) => {
    setCollaborators(
      collaborators.map((c) =>
        c.id === collaboratorId ? { ...c, permission: newPermission } : c,
      ),
    );
  };

  // 删除协作者
  const removeCollaborator = (collaboratorId: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== collaboratorId));
    setDeletingCollaborator(null);
  };

  // 格式化加入时间
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // 渲染协作者项
  const renderCollaboratorItem = (collaborator: Collaborator) => {
    const PermissionIcon = PERMISSION_CONFIG[collaborator.permission].icon;
    const StatusIcon = STATUS_CONFIG[collaborator.status].icon;
    const isCurrentUser = collaborator.id === currentUserId;

    return (
      <div
        key={collaborator.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={collaborator.avatar || "/placeholder.svg"}
                alt={collaborator.name}
              />
              <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {collaborator.status === "online" && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {collaborator.name}
                {isCurrentUser && (
                  <span className="text-sm text-gray-500 ml-1">(你)</span>
                )}
              </span>
              <Badge
                className={PERMISSION_CONFIG[collaborator.permission].color}
              >
                <PermissionIcon className="h-3 w-3 mr-1" />
                {PERMISSION_CONFIG[collaborator.permission].label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{collaborator.email}</span>
              <Badge
                variant="outline"
                className={STATUS_CONFIG[collaborator.status].color}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {STATUS_CONFIG[collaborator.status].label}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              加入时间: {formatJoinDate(collaborator.joinedAt)}
              {collaborator.lastActive &&
                ` • 最后活跃: ${collaborator.lastActive}`}
            </div>
          </div>
        </div>

        {canManage && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  updateCollaboratorPermission(collaborator.id, "admin")
                }
                disabled={collaborator.permission === "admin"}
              >
                <Shield className="mr-2 h-4 w-4" />
                设为管理员
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateCollaboratorPermission(collaborator.id, "editor")
                }
                disabled={collaborator.permission === "editor"}
              >
                <Edit className="mr-2 h-4 w-4" />
                设为编辑者
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateCollaboratorPermission(collaborator.id, "viewer")
                }
                disabled={collaborator.permission === "viewer"}
              >
                <Eye className="mr-2 h-4 w-4" />
                设为查看者
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingCollaborator(collaborator)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                移除协作者
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              协作者管理
            </DialogTitle>
            <DialogDescription>管理文件的协作者和权限设置</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="collaborators" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collaborators">协作者列表</TabsTrigger>
              {canManage && (
                <TabsTrigger value="invite">邀请协作者</TabsTrigger>
              )}
            </TabsList>

            {/* 协作者列表 */}
            <TabsContent value="collaborators" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">
                    协作者 ({collaborators.length})
                  </h3>
                  <Badge variant="outline">
                    在线:{" "}
                    {collaborators.filter((c) => c.status === "online").length}
                  </Badge>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {collaborators.map(renderCollaboratorItem)}
              </div>

              {!canManage && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    你只能查看协作者列表，无法进行管理操作。
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* 邀请协作者 */}
            {canManage && (
              <TabsContent value="invite" className="space-y-4">
                {showInviteSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      邀请已发送成功！
                    </AlertDescription>
                  </Alert>
                )}

                {/* 邮件邀请 */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">通过邮箱邀请</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="invite-email">邮箱地址</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="输入协作者邮箱"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-permission">权限级别</Label>
                        <Select
                          value={invitePermission}
                          onValueChange={(value: Permission) =>
                            setInvitePermission(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              管理员 - 可以管理协作者和编辑内容
                            </SelectItem>
                            <SelectItem value="editor">
                              编辑者 - 可以编辑文件内容
                            </SelectItem>
                            <SelectItem value="viewer">
                              查看者 - 只能查看文件内容
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={sendEmailInvite}
                        disabled={!inviteEmail.trim()}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        发送邀请
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* 邀请链接 */}
                  <div className="space-y-3">
                    <h3 className="font-medium">邀请链接</h3>
                    <p className="text-sm text-gray-600">
                      生成邀请链接，任何人都可以通过此链接加入文件
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={generateInviteLink}>
                        <Link className="h-4 w-4 mr-2" />
                        生成链接
                      </Button>
                      {inviteLink && (
                        <Button variant="outline" onClick={copyInviteLink}>
                          <Copy className="h-4 w-4 mr-2" />
                          复制链接
                        </Button>
                      )}
                    </div>
                    {inviteLink && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-mono break-all">
                          {inviteLink}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deletingCollaborator}
        onOpenChange={() => setDeletingCollaborator(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认移除协作者</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要移除 <strong>{deletingCollaborator?.name}</strong> 吗？
              <br />
              移除后，该用户将无法访问此文件。
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
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
