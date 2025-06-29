"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useUserStore } from "@/stores/user-store";
import { axios_instance } from "@/config/configuration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CollaboratorsDialog, {
  Permission,
  PERMISSION_CONFIG,
} from "@/components/common/collaborators-dialog";
import { ArrowLeft, Users, Settings, Edit, View } from "lucide-react";

const DocumentEditor = dynamic(
  () => import("@/components/common/document-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">正在加载编辑器...</p>
      </div>
    ),
  },
);

export default function DocumentPage() {
  const params = useParams();
  const documentId = params.id as string;

  // --- State Management ---
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState<Permission | null>(null);

  // --- Zustand Stores ---
  const { connect, disconnect } = useSocketStore();
  const userInfo = useUserStore((state) => state.userInfo);

  // --- Derived State (派生状态) ---

  // useMemo 可以避免在每次重渲染时都重新计算
  const isEditable = useMemo(() => {
    return permissionRole === "owner" || permissionRole === "editor";
  }, [permissionRole]);

  // --- API & Side Effects ---

  // 获取文档信息和用户权限
  const getPermission = async () => {
    const response = await axios_instance.get(
      `/documents/role?userId=${userInfo?.id}&documentId=${documentId}`,
    );
    setPermissionRole(response.data);
  };

  // 管理 WebSocket 连接
  useEffect(() => {
    if (documentId) {
      connect(documentId, "document");
    }
    return () => {
      disconnect();
    };
  }, [documentId, connect, disconnect]);

  // 当用户信息或文档ID变化时，重新获取权限
  useEffect(() => {
    getPermission();
  }, [documentId, userInfo]);

  // --- Render Logic ---

  const PermissionIcon = permissionRole ? (isEditable ? Edit : View) : null;

  // 在 documentId 准备好之前，可以显示加载状态
  if (!documentId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">正在加载文档...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部工具栏 */}
      <header className="border-b border-gray-200 px-4 py-3 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">协作文档 #{documentId}</h1>
              <p className="text-sm text-gray-500">实时协作文档</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {permissionRole && PermissionIcon ? (
              <Badge
                variant="outline"
                className={`${PERMISSION_CONFIG[permissionRole].color} border-2`}
              >
                <PermissionIcon className="h-3.5 w-3.5 mr-1.5" />
                你是: {PERMISSION_CONFIG[permissionRole].label}
              </Badge>
            ) : (
              <Badge variant="secondary">正在加载权限...</Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollaboratorsOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              协作者
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/*编辑器区域*/}
      <main className="flex-1 flex justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 sm:6">
          <DocumentEditor documentId={documentId} isEditable={isEditable} />
        </div>
      </main>

      {/* 协作者管理对话框 */}
      <CollaboratorsDialog
        open={isCollaboratorsOpen}
        onOpenChange={setIsCollaboratorsOpen}
        resourceId={documentId}
        resourceType={"document"}
        currentUserPermission={permissionRole as Permission}
        currentUserId={userInfo?.id as string}
      />
    </div>
  );
}
