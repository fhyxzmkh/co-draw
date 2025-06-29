"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Settings, Save } from "lucide-react";
import WhiteboardCanvas, {
  WhiteboardRef,
} from "@/components/common/whiteboard-canvas";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { axios_instance } from "@/config/configuration";
import { useSocketStore } from "@/stores/socket-store";
import CollaboratorsDialog, {
  Permission,
  PERMISSION_CONFIG,
} from "@/components/common/collaborators-dialog";
import { useUserStore } from "@/stores/user-store";
import { Badge } from "@/components/ui/badge";

export default function WhiteboardPage() {
  const params = useParams();
  const id = params.id;

  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);

  const [permissionRole, setPermissionRole] = useState<Permission | null>(null);

  const whiteboardRef = useRef<WhiteboardRef>(null);

  const { connect, disconnect } = useSocketStore();

  const userInfo = useUserStore((state) => state.userInfo);

  const triggerSave = () => {
    // 通过 ref 调用子组件的方法，子组件会通过 onSave prop 回传数据
    whiteboardRef.current?.saveCanvasAsJson();
  };

  const handleSave = async (data: object) => {
    try {
      await axios_instance.patch(`/boards/${id}`, {
        content: JSON.stringify(data),
      });
      toast.success("保存成功！");
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败，请检查网络或联系管理员。");
    }
  };

  // const handleShare = () => {
  //   // 这里可以实现分享白板的逻辑
  //   console.log("分享白板");
  // };

  const getPermission = async () => {
    const response = await axios_instance.get(
      `/boards/role?userId=${userInfo?.id}&boardId=${id}`,
    );
    setPermissionRole(response.data);
  };

  useEffect(() => {
    connect(id as string, "board");

    // 组件卸载时，调用 disconnect action 来清理连接
    return () => {
      disconnect();
    };
  }, [connect, disconnect, id]);

  useEffect(() => {
    getPermission();
  }, [id, userInfo]);

  const PermissionIcon = permissionRole
    ? PERMISSION_CONFIG[permissionRole].icon
    : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 白板头部工具栏 */}
      <header className="border-b border-gray-200 px-4 py-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">协作白板 #{id}</h1>
              <p className="text-sm text-gray-600">实时协作绘图工具</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <>
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
            </>

            <Button variant="outline" size="sm" onClick={triggerSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollaboratorsOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              协作者
            </Button>
            {/*<Button variant="outline" size="sm" onClick={handleShare}>*/}
            {/*  <Share2 className="h-4 w-4 mr-2" />*/}
            {/*  分享*/}
            {/*</Button>*/}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 白板画布 */}
      <main className="flex-1">
        <WhiteboardCanvas
          width={1200}
          height={800}
          boardId={id as string}
          ref={whiteboardRef}
          onSave={handleSave}
          currentUserPermission={permissionRole as Permission}
        />
      </main>

      {/*协作者管理对话框 */}
      <CollaboratorsDialog
        open={isCollaboratorsOpen}
        onOpenChange={setIsCollaboratorsOpen}
        resourceId={id as string}
        resourceType={"board"}
        currentUserPermission={permissionRole as Permission}
        currentUserId={userInfo?.id as string}
      />
    </div>
  );
}
