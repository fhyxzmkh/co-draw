"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Calendar,
  LogOut,
  Settings,
  Grid3X3,
  List,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { BoardInfo } from "@/stores/board-store";
import { toast } from "sonner";
import { axios_login_instance } from "@/config/configuration";

export default function HomePage() {
  const [whiteboards, setWhiteboards] = useState<BoardInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingBoard, setEditingBoard] = useState<BoardInfo | null>(null);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: "", description: "" });

  const userInfo = useUserStore((state) => state.userInfo);

  // 过滤白板
  const filteredWhiteboards = whiteboards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 获取白板
  const findAllWhiteboards = async () => {
    const data = await axios_login_instance.get(
      `/boards/my?userId=${userInfo?.id}`,
    );
    console.log(data);
    setWhiteboards(data.data as BoardInfo[]);
  };

  // 创建新白板
  const handleCreateBoard = async () => {
    const title = newBoard.title.trim();
    const description = newBoard.description.trim();

    if (!title) {
      toast.warning("Please enter a title");
    }

    const data = await axios_login_instance.post(`/boards`, {
      title: title,
      description: description,
      ownerId: userInfo?.id,
    });
    if (data.status === 200) {
      toast.success("Board successfully created!");
    }

    setNewBoard({ title: "", description: "" });
    setIsCreateDialogOpen(false);
  };

  // 编辑白板
  const handleEditBoard = async () => {
    if (editingBoard) {
      const id = editingBoard.id;
      const title = editingBoard.title.trim();
      const description = editingBoard.description.trim();

      if (!title) {
        toast.warning("Please enter a title");
      }

      const data = await axios_login_instance.patch(`/boards/${id}`, {
        title: title,
        description: description,
      });

      if (data.status === 200) {
        toast.success("Board successfully updated");
      }
      findAllWhiteboards();
      setEditingBoard(null);
    }
  };

  // 删除白板
  const handleDeleteBoard = async (id: string) => {
    const data = await axios_login_instance.delete(`/boards/${id}`);
    if (data.status === 200) {
      toast.success("Board successfully deleted");
    }

    findAllWhiteboards();
    setDeletingBoardId(null);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  useEffect(() => {
    findAllWhiteboards();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold">协作白板</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {userInfo?.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {userInfo?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userInfo?.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">我的白板</h2>
            <p className="text-gray-600 mt-1">管理和访问你的所有协作白板</p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  创建白板
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新白板</DialogTitle>
                  <DialogDescription>
                    创建一个新的协作白板开始你的创意工作
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">白板标题</Label>
                    <Input
                      id="title"
                      placeholder="输入白板标题"
                      value={newBoard.title}
                      onChange={(e) =>
                        setNewBoard({ ...newBoard, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">描述（可选）</Label>
                    <Input
                      id="description"
                      placeholder="输入白板描述"
                      value={newBoard.description}
                      onChange={(e) =>
                        setNewBoard({
                          ...newBoard,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button onClick={handleCreateBoard}>创建</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 搜索和视图切换 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索白板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 白板列表 */}
        {filteredWhiteboards.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "未找到匹配的白板" : "还没有白板"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "尝试使用不同的关键词搜索"
                : "创建你的第一个协作白板开始工作"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建白板
              </Button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredWhiteboards.map((board) => (
              <Card
                key={board.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/whiteboard/${board.id}`}>
                        <CardTitle className="text-lg hover:text-primary cursor-pointer line-clamp-1">
                          {board.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-1 line-clamp-2">
                        {board.description}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingBoard(board)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingBoardId(board.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <Link href={`/whiteboard/${board.id}`}>
                    <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors">
                      <img
                        src="/white-board.svg"
                        alt={board.title}
                        className="mx-auto"
                      />
                    </div>
                  </Link>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {board.collaboratorIds === null ||
                          JSON.stringify(board.collaboratorIds).length === 0
                            ? "无"
                            : JSON.stringify(board.collaboratorIds).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(board.updatedAt)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {userInfo?.id === board.ownerId ? "我创建的" : "我参与的"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 编辑白板对话框 */}
        <Dialog
          open={!!editingBoard}
          onOpenChange={() => setEditingBoard(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑白板</DialogTitle>
              <DialogDescription>修改白板的标题和描述信息</DialogDescription>
            </DialogHeader>
            {editingBoard && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">白板标题</Label>
                  <Input
                    id="edit-title"
                    value={editingBoard.title}
                    onChange={(e) =>
                      setEditingBoard({
                        ...editingBoard,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">描述</Label>
                  <Input
                    id="edit-description"
                    value={editingBoard.description}
                    onChange={(e) =>
                      setEditingBoard({
                        ...editingBoard,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBoard(null)}>
                取消
              </Button>
              <Button onClick={handleEditBoard}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <AlertDialog
          open={!!deletingBoardId}
          onOpenChange={() => setDeletingBoardId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                你确定要删除这个白板吗？此操作无法撤销，所有相关数据将被永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deletingBoardId && handleDeleteBoard(deletingBoardId)
                }
                className="bg-destructive hover:bg-destructive/90"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
