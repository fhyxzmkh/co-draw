"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Share2, Settings, Save } from "lucide-react";
import WhiteboardCanvas, {
  WhiteboardRef,
} from "@/components/whiteboard/whiteboard-canvas";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { axios_login_instance } from "@/config/configuration";

export default function WhiteboardPage() {
  const params = useParams();
  const id = params.id;

  const whiteboardRef = useRef<WhiteboardRef>(null);

  const triggerSave = () => {
    // 通过 ref 调用子组件的方法，子组件会通过 onSave prop 回传数据
    whiteboardRef.current?.saveCanvasAsJson();
  };

  const handleSave = async (data: object) => {
    try {
      await axios_login_instance.patch(`/boards/${id}`, {
        content: JSON.stringify(data),
      });
      toast.success("保存成功！");
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败，请检查网络或联系管理员。");
    }
  };

  const handleShare = () => {
    // 这里可以实现分享白板的逻辑
    console.log("分享白板");
  };

  const handleCollaborators = () => {
    // 这里可以实现管理协作者的逻辑
    console.log("管理协作者");
  };

  const loadBoardContent = async () => {
    if (!id) return; // 如果没有 id，则不加载

    try {
      toast.info("正在加载白板内容...");
      const response = await axios_login_instance.get(`/boards/${id}`);
      const boardData = response.data;

      if (boardData && boardData.content) {
        const jsonDataObject = boardData.content;

        whiteboardRef.current?.loadCanvasFromJson(jsonDataObject);
      } else {
        toast.success("这是一个新的白板，开始创作吧！");
      }
    } catch (error) {
      console.error("加载白板失败:", error);
      toast.error("加载白板内容失败。");
    }
  };

  useEffect(() => {
    loadBoardContent();
  }, []);

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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={triggerSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollaborators}>
              <Users className="h-4 w-4 mr-2" />
              协作者
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </Button>
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
          ref={whiteboardRef}
          onSave={handleSave}
        />
      </main>
    </div>
  );
}
