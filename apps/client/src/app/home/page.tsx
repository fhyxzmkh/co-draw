"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  FileText,
  PenSquare,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import { BoardInfo } from "@/stores/board-store";
import { DocumentInfo } from "@/stores/document-store";
import { toast } from "sonner";
import { axios_instance } from "@/config/configuration";
import { useRouter } from "next/navigation";

// 定义通用的文件类型
type FileType = "whiteboard" | "document";

// 统一白板和文档的数据结构，方便在同一个列表中处理
type Item = (BoardInfo | DocumentInfo) & { type: FileType };

export default function HomePage() {
  const router = useRouter();

  // --- 重构后的状态管理 ---
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<FileType>("whiteboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 对话框相关状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  // 创建新文件相关状态
  const [newItem, setNewItem] = useState({ title: "", description: "" });
  const [creationType, setCreationType] = useState<FileType>("whiteboard");

  const userInfo = useUserStore((state) => state.userInfo);
  const fileTypeMap = {
    whiteboard: { name: "白板", endpoint: "boards" },
    document: { name: "文档", endpoint: "documents" },
  };

  // --- 通用数据获取函数 ---
  const fetchItems = async (type: FileType) => {
    if (!userInfo?.id) return;
    setIsLoading(true);
    try {
      const { endpoint } = fileTypeMap[type];
      const response = await axios_instance.get(
        `/${endpoint}/my?userId=${userInfo.id}`,
      );
      // 为每个项目添加 `type` 属性，方便后续操作
      const typedItems = response.data.map((item: any) => ({ ...item, type }));
      setItems(typedItems);
    } catch (error) {
      toast.error(`获取${fileTypeMap[type].name}列表失败`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 通用操作函数 ---
  const handleCreateItem = async () => {
    const { name, endpoint } = fileTypeMap[creationType];
    const title = newItem.title.trim();
    if (!title) {
      toast.warning(`请输入${name}标题`);
      return;
    }

    try {
      const response = await axios_instance.post(`/${endpoint}`, {
        title: title,
        description: newItem.description.trim(),
        ownerId: userInfo?.id,
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(`${name}创建成功!`);
        // 如果创建的类型和当前 Tab 一致，则刷新列表
        if (creationType === activeTab) {
          fetchItems(activeTab);
        }
        // 关闭对话框并重置状态
        setIsCreateDialogOpen(false);
        setNewItem({ title: "", description: "" });
      }
    } catch (error) {
      toast.error("创建失败，请稍后重试");
      console.error(error);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    const { id, type, title, description } = editingItem;
    const { name, endpoint } = fileTypeMap[type];

    if (!title.trim()) {
      toast.warning(`请输入${name}标题`);
      return;
    }

    try {
      const response = await axios_instance.patch(`/${endpoint}/${id}`, {
        title: title.trim(),
        description: description.trim(),
      });

      if (response.status === 200) {
        toast.success(`${name}更新成功`);
        fetchItems(activeTab); // 刷新当前列表
        setEditingItem(null); // 关闭对话框
      }
    } catch (error) {
      toast.error("更新失败，请稍后重试");
      console.error(error);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    const { id, type } = deletingItem;
    const { name, endpoint } = fileTypeMap[type];

    try {
      const response = await axios_instance.delete(
        `/${endpoint}?userId=${userInfo?.id}&fileId=${id}`,
      );
      if (response.status === 200) {
        toast.success(`${name}删除成功`);
        fetchItems(activeTab); // 刷新当前列表
        setDeletingItem(null); // 关闭对话框
      }
    } catch (error) {
      toast.error("删除失败，请稍后重试");
      console.error(error);
    }
  };

  // --- 其他辅助函数 ---
  const logout = async () => {
    try {
      await axios_instance.post("/auth/logout");
      toast.success("退出登录成功");
      router.push("/auth/login");
    } catch (error: unknown) {
      toast.error("退出登录失败");
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // 筛选逻辑
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- useEffect Hooks ---
  useEffect(() => {
    if (userInfo?.id) {
      fetchItems(activeTab);
    }
  }, [userInfo, activeTab]); // 当用户或 activeTab 变化时重新获取数据

  // 根据类型获取对应的名称，用于UI显示
  const getTypeName = (type: FileType) => fileTypeMap[type].name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Co Draw</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {userInfo?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{userInfo?.username}</span>
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
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">我的文件</h2>
            <p className="text-gray-600 mt-1">管理和访问你的所有协作文件</p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                创建
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新文件</DialogTitle>
                <DialogDescription>
                  选择要创建的文件类型，开始你的创意工作
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <RadioGroup
                  value={creationType}
                  onValueChange={(v) => setCreationType(v as FileType)}
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div>
                    <RadioGroupItem
                      value="whiteboard"
                      id="r1"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r1"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <PenSquare className="mb-2 h-6 w-6" />
                      白板
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="document"
                      id="r2"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r2"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <FileText className="mb-2 h-6 w-6" />
                      文档
                    </Label>
                  </div>
                </RadioGroup>
                <div>
                  <Label htmlFor="title" className="m-2">
                    标题
                  </Label>
                  <Input
                    id="title"
                    placeholder={`输入${getTypeName(creationType)}标题`}
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="m-2">
                    描述（可选）
                  </Label>
                  <Input
                    id="description"
                    placeholder="输入描述信息"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
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
                <Button onClick={handleCreateItem}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 筛选和视图切换 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "whiteboard" ? "ghost" : "ghost"}
              onClick={() => setActiveTab("whiteboard")}
              className={`rounded-b-none ${activeTab === "whiteboard" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            >
              <PenSquare className="mr-2 h-4 w-4" />
              我的白板
            </Button>
            <Button
              variant={activeTab === "document" ? "ghost" : "ghost"}
              onClick={() => setActiveTab("document")}
              className={`rounded-b-none ${activeTab === "document" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
            >
              <FileText className="mr-2 h-4 w-4" />
              我的文档
            </Button>
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`搜索${getTypeName(activeTab)}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 文件列表 */}
        {isLoading ? (
          <div className="text-center py-12">加载中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? "未找到匹配的文件"
                : `还没有${getTypeName(activeTab)}`}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "尝试使用不同的关键词搜索"
                : `创建你的第一个${getTypeName(activeTab)}开始工作`}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                创建文件
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="group transition-shadow hover:shadow-md"
              >
                <div className="flex items-center p-4">
                  <div className="flex-1">
                    <Link href={`/${item.type}/${item.id}`}>
                      <p className="text-base font-semibold hover:text-primary cursor-pointer line-clamp-1">
                        {item.title}
                      </p>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {item.description || "暂无描述"}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600 mx-6">
                    {/*<div className="flex items-center gap-1">*/}
                    {/*  <Users className="h-4 w-4" />*/}
                    {/*  <span>人数</span>*/}
                    {/*</div>*/}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs mx-4">
                    {userInfo?.id === item.ownerId ? "我创建的" : "我参与的"}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => setEditingItem(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingItem(item)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 编辑对话框 (通用) */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                编辑{editingItem ? getTypeName(editingItem.type) : ""}
              </DialogTitle>
              <DialogDescription>
                修改{editingItem ? getTypeName(editingItem.type) : ""}
                的标题和描述信息
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="edit-title">标题</Label>
                  <Input
                    id="edit-title"
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">描述</Label>
                  <Input
                    id="edit-description"
                    value={editingItem.description}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button onClick={handleEditItem}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 (通用) */}
        <AlertDialog
          open={!!deletingItem}
          onOpenChange={() => setDeletingItem(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                你确定要删除这个
                {deletingItem ? getTypeName(deletingItem.type) : ""}
                吗？此操作无法撤销，所有相关数据将被永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
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
