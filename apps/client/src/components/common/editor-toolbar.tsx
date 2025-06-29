"use client";

import type React from "react";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Palette,
  Highlighter,
  Underline,
  Heading3,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

type Props = {
  editor: Editor;
};

export const EditorToolbar = ({ editor }: Props) => {
  const fontFamilies = ["Inter", "Arial", "Georgia", "Courier New", "Verdana"];
  const fontSizes = ["12px", "14px", "16px", "18px", "24px", "30px", "36px"];

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";

  const [_, setForceUpdate] = useState(0);

  useEffect(() => {
    // 当编辑器的内容或选区更新时，Tiptap会触发这些事件
    const handleUpdate = () => {
      // 调用setState函数，这会告诉React需要重新渲染该组件
      setForceUpdate((prev) => prev + 1);
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    // 组件卸载时，务必移除事件监听，防止内存泄漏
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center flex-wrap gap-3">
            {/* 字体和字号选择组 */}
            <div className="flex items-center gap-2 p-2 bg-gray-50/80 rounded-lg border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      onValueChange={(value) =>
                        editor.chain().focus().setFontFamily(value).run()
                      }
                      defaultValue={
                        editor.getAttributes("textStyle").fontFamily || "Inter"
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8 text-sm border-0 bg-white/80 hover:bg-white transition-colors">
                        <SelectValue placeholder="字体" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontFamilies.map((font) => (
                          <SelectItem
                            key={font}
                            value={font}
                            className="text-sm"
                          >
                            <span style={{ fontFamily: font }}>{font}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>选择字体</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      value={currentFontSize}
                      onValueChange={(value) => {
                        if (value === "default") {
                          editor.chain().focus().unsetFontSize().run();
                        } else {
                          editor.chain().focus().setFontSize(value).run();
                        }
                      }}
                    >
                      <SelectTrigger className="w-[85px] h-8 text-sm border-0 bg-white/80 hover:bg-white transition-colors">
                        <SelectValue placeholder="字号" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default" className="text-sm">
                          默认
                        </SelectItem>
                        {fontSizes.map((size) => (
                          <SelectItem
                            key={size}
                            value={size}
                            className="text-sm"
                          >
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>选择字号</TooltipContent>
              </Tooltip>

              {/* 颜色选择器 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <label
                      htmlFor="color-picker"
                      className="flex items-center justify-center w-8 h-8 bg-white/80 hover:bg-white border border-gray-200/60 rounded-md cursor-pointer transition-all duration-200 hover:shadow-sm group"
                    >
                      <Palette className="h-4 w-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                      <div
                        className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            editor.getAttributes("textStyle").color ||
                            "#000000",
                        }}
                      />
                    </label>
                    <input
                      id="color-picker"
                      type="color"
                      onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
                        editor
                          .chain()
                          .focus()
                          .setColor(event.target.value)
                          .run()
                      }
                      value={
                        editor.getAttributes("textStyle").color || "#000000"
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>选择文字颜色</TooltipContent>
              </Tooltip>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* 基础格式化按钮组 */}
            <div className="flex items-center gap-1 p-1.5 bg-gray-50/80 rounded-lg border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("bold")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleBold().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>粗体 (Ctrl+B)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("italic")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleItalic().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>斜体 (Ctrl+I)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("underline")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Underline className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>下划线 (Ctrl+U)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("strike")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleStrike().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>删除线</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("highlight")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHighlight().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 data-[state=on]:border-yellow-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Highlighter className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>高亮</TooltipContent>
              </Tooltip>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* 标题按钮组 */}
            <div className="flex items-center gap-1 p-1.5 bg-gray-50/80 rounded-lg border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 1 })}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Heading1 className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>标题 1</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 2 })}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Heading2 className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>标题 2</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("heading", { level: 3 })}
                    onPressedChange={() =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700 data-[state=on]:border-purple-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <Heading3 className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>标题 3</TooltipContent>
              </Tooltip>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* 列表按钮组 */}
            <div className="flex items-center gap-1 p-1.5 bg-gray-50/80 rounded-lg border border-gray-200/60">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("bulletList")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <List className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>无序列表</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={editor.isActive("orderedList")}
                    onPressedChange={() =>
                      editor.chain().focus().toggleOrderedList().run()
                    }
                    className="h-8 w-8 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-200 hover:bg-white/80 transition-all duration-200"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>有序列表</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
