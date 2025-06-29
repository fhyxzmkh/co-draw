"use client";

import { type Editor } from "@tiptap/react";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

type Props = {
  editor: Editor;
};

export const EditorToolbar = ({ editor }: Props) => {
  const fontFamilies = ["Inter", "Arial", "Georgia", "Courier New", "Verdana"];
  const fontSizes = ["12px", "14px", "16px", "18px", "24px", "30px", "36px"];

  return (
    <div className="p-2 border-b border-gray-200 flex items-center flex-wrap gap-1">
      {/* 字体选择 */}
      <Select
        onValueChange={(value) =>
          editor.chain().focus().setFontFamily(value).run()
        }
        defaultValue={editor.getAttributes("textStyle").fontFamily || "Inter"}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="字体" />
        </SelectTrigger>
        <SelectContent>
          {fontFamilies.map((font) => (
            <SelectItem key={font} value={font}>
              {font}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 字号选择 */}
      <Select
        onValueChange={(value) =>
          editor.chain().focus().setMark("textStyle", { fontSize: value }).run()
        }
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="字号" />
        </SelectTrigger>
        <SelectContent>
          {fontSizes.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 颜色选择 */}
      <div className="flex items-center p-1 border rounded-md">
        <label htmlFor="color-picker" className="cursor-pointer">
          <Palette className="h-4 w-4" />
        </label>
        <input
          id="color-picker"
          type="color"
          onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
            editor.chain().focus().setColor(event.target.value).run()
          }
          value={editor.getAttributes("textStyle").color || "#000000"}
          className="w-4 h-4 border-none bg-transparent p-0 m-0"
          style={{ padding: 0, border: "none", background: "none" }}
        />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* 基础格式化 */}
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("highlight")}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="h-4 w-4" />
      </Toggle>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* 标题 */}
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      {/* 列表 */}
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  );
};
