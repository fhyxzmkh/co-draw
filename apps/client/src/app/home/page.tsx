"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useUserStore } from "@/stores/user-store";
import type { BoardInfo } from "@/stores/board-store";
import type { DocumentInfo } from "@/stores/document-store";
import { toast } from "sonner";
import { axios_instance } from "@/config/configuration";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/stores/message-store";

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

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 对话框相关状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  // 创建新文件相关状态
  const [newItem, setNewItem] = useState({ title: "", description: "" });
  const [creationType, setCreationType] = useState<FileType>("whiteboard");

  // 邀请列表相关状态
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

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

    if (editingItem.ownerId !== userInfo?.id) {
      toast.warning("你没有权限编辑此文件");
      return;
    }

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

    if (deletingItem.ownerId !== userInfo?.id) {
      toast.warning("你没有权限删除此文件");
      return;
    }

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

  // --- 邀请相关 ---
  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const response = await axios_instance.get(
        `/messages/invitation/list?userId=${userInfo?.id}`,
      );

      setInvitations(response.data);
    } catch (error) {
      toast.error("获取邀请列表失败");
      console.error(error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await axios_instance.patch(
        `/messages/invitation?invitationId=${invitationId}&opt=1`,
      );

      if (response.status === 200) {
        toast.success("已接受邀请！");
        // 刷新邀请列表
        await fetchInvitations();
        // 刷新主内容区的文件列表，新接受的文件可能会出现在列表中
        await fetchItems(activeTab);
      }
    } catch (error) {
      toast.error("接受邀请失败");
      console.error(error);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await axios_instance.patch(
        `/messages/invitation?invitationId=${invitationId}&opt=0`,
      );

      if (response.status === 200) {
        toast.info("已拒绝邀请");
        // 仅刷新邀请列表
        await fetchInvitations();
      }
    } catch (error) {
      toast.error("拒绝邀请失败");
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

  // 分页逻辑
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // 分页控制函数
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // --- useEffect Hooks ---
  useEffect(() => {
    if (userInfo?.id) {
      fetchItems(activeTab);
      fetchInvitations();
    }
  }, [userInfo, activeTab]); // 当用户或 activeTab 变化时重新获取数据

  // 当搜索或切换tab时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // 根据类型获取对应的名称，用于UI显示
  const getTypeName = (type: FileType) => fileTypeMap[type].name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 头部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Co Draw
                </h1>
                <p className="text-xs text-gray-500">协作创作平台</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog
                open={isInvitationDialogOpen}
                onOpenChange={setIsInvitationDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-blue-50"
                  >
                    <Inbox className="h-5 w-5" />
                    {invitations.filter((inv) => !inv.confirmed).length > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs animate-pulse"
                      >
                        {invitations.filter((inv) => !inv.confirmed).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Inbox className="h-5 w-5" />
                      收到的邀请
                    </DialogTitle>
                    <DialogDescription>
                      在这里处理其他用户发来的协作邀请。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
                    {isLoadingInvitations ? (
                      <div className="text-center text-gray-500 py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        正在加载邀请...
                      </div>
                    ) : invitations.length > 0 ? (
                      invitations.map((inv) => (
                        <Card
                          key={inv.id}
                          className="transition-all hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <p className="font-semibold text-gray-800">
                                  {inv.title}
                                </p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {inv.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {inv.confirmed ? (
                                  <Badge
                                    variant="secondary"
                                    className="font-normal"
                                  >
                                    已处理
                                  </Badge>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleAcceptInvitation(inv.id)
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      接受
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDeclineInvitation(inv.id)
                                      }
                                    >
                                      拒绝
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <Inbox className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          没有待处理的邀请
                        </h3>
                        <p className="text-sm text-gray-500">
                          你的收件箱是空的。
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-blue-50"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {userInfo?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {userInfo?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userInfo?.username}</p>
                    <p className="text-xs text-gray-500">管理你的账户</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="hover:bg-blue-50">
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={logout}
                    className="hover:bg-red-50 text-red-600"
                  >
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">
              我的文件
            </h2>
            <p className="text-gray-600 text-lg">管理和访问你的所有协作文件</p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all">
                <Plus className="h-4 w-4" />
                创建文件
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">创建新文件</DialogTitle>
                <DialogDescription>
                  选择要创建的文件类型，开始你的创意工作
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <RadioGroup
                  value={creationType}
                  onValueChange={(v) => setCreationType(v as FileType)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="whiteboard"
                      id="r1"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="r1"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-white p-6 hover:bg-blue-50 hover:border-blue-200 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all"
                    >
                      <div className="p-3 bg-blue-100 rounded-lg mb-3">
                        <PenSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="font-medium">白板</span>
                      <span className="text-xs text-gray-500 mt-1">
                        自由绘制和协作
                      </span>
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
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-white p-6 hover:bg-indigo-50 hover:border-indigo-200 peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 [&:has([data-state=checked])]:border-indigo-500 cursor-pointer transition-all"
                    >
                      <div className="p-3 bg-indigo-100 rounded-lg mb-3">
                        <FileText className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="font-medium">文档</span>
                      <span className="text-xs text-gray-500 mt-1">
                        文字编辑和协作
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium mb-2 block"
                    >
                      标题
                    </Label>
                    <Input
                      id="title"
                      placeholder={`输入${getTypeName(creationType)}标题`}
                      value={newItem.title}
                      onChange={(e) =>
                        setNewItem({ ...newItem, title: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium mb-2 block"
                    >
                      描述（可选）
                    </Label>
                    <Input
                      id="description"
                      placeholder="输入描述信息"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleCreateItem}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 筛选和视图切换 */}
        <Card className="mb-6 shadow-sm border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === "whiteboard" ? "default" : "ghost"}
                  onClick={() => setActiveTab("whiteboard")}
                  className={`rounded-md transition-all ${
                    activeTab === "whiteboard"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
                  }`}
                >
                  <PenSquare className="mr-2 h-4 w-4" />
                  我的白板
                </Button>
                <Button
                  variant={activeTab === "document" ? "default" : "ghost"}
                  onClick={() => setActiveTab("document")}
                  className={`rounded-md transition-all ${
                    activeTab === "document"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
                  }`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  我的文档
                </Button>
              </div>

              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`搜索${getTypeName(activeTab)}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/80 border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-32 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 条/页</SelectItem>
                    <SelectItem value="10">10 条/页</SelectItem>
                    <SelectItem value="20">20 条/页</SelectItem>
                    <SelectItem value="50">50 条/页</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 文件列表 */}
        {isLoading ? (
          <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="p-6 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  {activeTab === "whiteboard" ? (
                    <PenSquare className="h-10 w-10 text-gray-400" />
                  ) : (
                    <FileText className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery
                    ? "未找到匹配的文件"
                    : `还没有${getTypeName(activeTab)}`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? "尝试使用不同的关键词搜索"
                    : `创建你的第一个${getTypeName(activeTab)}开始工作`}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    创建文件
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {currentItems.map((item) => (
                <Card
                  key={item.id}
                  className="group transition-all hover:shadow-lg hover:-translate-y-0.5 border-0 bg-white/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        <div
                          className={`p-3 rounded-xl ${
                            item.type === "whiteboard"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-indigo-100 text-indigo-600"
                          }`}
                        >
                          {item.type === "whiteboard" ? (
                            <PenSquare className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/${item.type}/${item.id}`}>
                          <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer line-clamp-1 transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.description || "暂无描述"}
                        </p>
                      </div>

                      <div className="hidden lg:flex items-center gap-8 text-sm text-gray-600 mx-8">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            userInfo?.id === item.ownerId
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs ${
                            userInfo?.id === item.ownerId
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {userInfo?.id === item.ownerId
                            ? "我创建的"
                            : "我参与的"}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingItem(item)}
                              className="hover:bg-blue-50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingItem(item)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <Card className="shadow-sm border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)}{" "}
                      条，共 {totalItems} 条结果
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="hover:bg-blue-50 bg-transparent"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="hover:bg-blue-50 bg-transparent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === pageNum
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="hover:bg-blue-50 bg-transparent"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className="hover:bg-blue-50 bg-transparent"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 编辑对话框 (通用) */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">
                编辑{editingItem ? getTypeName(editingItem.type) : ""}
              </DialogTitle>
              <DialogDescription>
                修改{editingItem ? getTypeName(editingItem.type) : ""}
                的标题和描述信息
              </DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4 py-4">
                <div>
                  <Label
                    htmlFor="edit-title"
                    className="text-sm font-medium mb-2 block"
                  >
                    标题
                  </Label>
                  <Input
                    id="edit-title"
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-description"
                    className="text-sm font-medium mb-2 block"
                  >
                    描述
                  </Label>
                  <Input
                    id="edit-description"
                    value={editingItem.description}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button
                onClick={handleEditItem}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                保存
              </Button>
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
              <AlertDialogTitle className="text-xl">确认删除</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                你确定要删除这个
                {deletingItem ? getTypeName(deletingItem.type) : ""}
                吗？此操作无法撤销，所有相关数据将被永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700"
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
