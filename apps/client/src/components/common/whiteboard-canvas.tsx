"use client";

import React, { forwardRef, useImperativeHandle } from "react";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pen,
  Eraser,
  Palette,
  Trash2,
  Download,
  Square,
  Circle,
  Type,
  MousePointer,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useSocketStore } from "@/stores/socket-store";
import { Permission } from "@/components/common/collaborators-dialog";

interface WhiteboardCanvasProps {
  width?: number;
  height?: number;
  boardId: string;
  onSave?: (data: object) => void;
  currentUserPermission: Permission;
}

export interface WhiteboardRef {
  saveCanvasAsJson: () => void;
  loadCanvasFromJson: (jsonData: object) => void;
}

type Tool = "select" | "pen" | "eraser" | "rectangle" | "circle" | "text";

const COLORS = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#000080",
  "#008000",
  "#FF6347",
  "#4B0082",
  "#FFD700",
  "#DC143C",
  "#00CED1",
  "#32CD32",
];

const WhiteboardCanvas = forwardRef<WhiteboardRef, WhiteboardCanvasProps>(
  (
    {
      width = 1200,
      height = 800,
      boardId,
      onSave,
      currentUserPermission,
    }: WhiteboardCanvasProps,
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [currentTool, setCurrentTool] = useState<Tool>("pen");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState([5]);
    const [isDrawing, setIsDrawing] = useState(false);

    const sk = useSocketStore((state) => state.socket);

    const isReadOnly = currentUserPermission === "viewer";

    useEffect(() => {
      if (!canvasRef.current) return;

      // 初始化fabric.js画布
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
      });

      fabricCanvasRef.current = canvas;

      // --- 权限控制 ---
      // 初始化时根据权限设置画布交互性
      if (isReadOnly) {
        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
        canvas.defaultCursor = "not-allowed";
      } else {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushWidth[0];
      }

      // 监听绘图事件
      canvas.on("path:created", (e: any) => {
        if (isReadOnly || !e.path) return;
        setIsDrawing(false);

        e.path.set("id", nanoid().toString());
        const objectData = e.path.toJSON(["id"]);

        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit("drawing", { boardId, object: objectData });
        }
      });

      canvas.on("mouse:down", () => {
        if (isReadOnly) return;
        setIsDrawing(true);
      });

      canvas.on("mouse:up", () => {
        setIsDrawing(false);
      });

      canvas.on("object:modified", (e) => {
        if (isReadOnly || !e.target) return;

        // e.target 就是被修改的那个对象
        const modifiedObject: any = e.target;

        // 确保对象有 id (如果它是从其他客户端同步过来的，也应该有id)
        if (!modifiedObject.id) {
          modifiedObject.set("id", nanoid().toString);
        }

        // Emit!
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit("object:modified", {
            boardId,
            object: modifiedObject.toJSON(["id"]),
          });
        }
      });

      return () => {
        canvas.dispose();
      };
    }, [isReadOnly]);

    // 使用一个单独的 useEffect 来处理权限变化对现有画布的影响
    useEffect(() => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const setCanvasInteractivity = (isInteractive: boolean) => {
        canvas.isDrawingMode = isInteractive
          ? currentTool === "pen" || currentTool === "eraser"
          : false;
        canvas.selection = isInteractive;
        canvas.defaultCursor = isInteractive ? "default" : "not-allowed";

        canvas.forEachObject((obj) => {
          obj.selectable = isInteractive;
          obj.evented = isInteractive;
        });

        canvas.renderAll();
      };

      if (isReadOnly) {
        setCanvasInteractivity(false);
      } else {
        setCanvasInteractivity(true);
        // 确保工具状态正确
        handleToolChange(currentTool);
      }
    }, [isReadOnly, fabricCanvasRef.current]);

    useEffect(() => {
      const canvas = fabricCanvasRef.current;

      if (!canvas || !sk) return;

      const handleIncomingObject = (fabricObject: any) => {
        // 观察者接收到的对象也应是不可交互的
        if (isReadOnly) {
          fabricObject.selectable = false;
          fabricObject.evented = false;
        }
        canvas.add(fabricObject);
        canvas.renderAll();
      };

      // 监听 'board:state' 事件
      sk.on("board:state", (boardContent) => {
        if (boardContent && fabricCanvasRef.current) {
          fabricCanvasRef.current.loadFromJSON(boardContent, () => {
            if (isReadOnly) {
              fabricCanvasRef.current?.forEachObject((obj) => {
                obj.selectable = false;
                obj.evented = false;
              });
            }
            fabricCanvasRef.current?.renderAll();
          });
        }
      });

      // 监听 "drawing" 广播
      sk.on("drawing", (object) => {
        fabric.util.enlivenObjects(
          [object],
          (objects: any) => handleIncomingObject(objects[0]),
          "",
        );
      });

      // 监听 "object:modified" 广播
      sk.on("object:modified", (object) => {
        const objToUpdate = canvas
          .getObjects()
          .find((o: any) => o.id === object.id);
        if (objToUpdate) {
          // 更新对象属性，保留其交互性设置
          const isSelectable = objToUpdate.selectable;
          const isEvented = objToUpdate.evented;
          objToUpdate.set(object);
          objToUpdate.set({
            selectable: isSelectable,
            evented: isEvented,
          });
          canvas.renderAll();
        }
      });

      // 监听 "objects:removed" 广播
      sk.on("objects:removed", (objectIds: string[]) => {
        if (!fabricCanvasRef.current || !objectIds || objectIds.length === 0)
          return;
        const canvas = fabricCanvasRef.current;
        const objectsToRemove = canvas
          .getObjects()
          .filter((obj: any) => objectIds.includes(obj.id));
        if (objectsToRemove.length > 0) {
          canvas.remove(...objectsToRemove);
          canvas.renderAll();
        }
      });

      sk.on("canvas:cleared", () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.backgroundColor = "#ffffff";
          fabricCanvasRef.current.renderAll();
        }
      });

      // 组件卸载时，移除所有监听器，防止内存泄漏
      return () => {
        sk.off("initialState");
        sk.off("drawing");
        sk.off("object:modified");
        sk.off("objects:removed");
        sk.off("canvas:cleared");
      };
    }, [sk, isReadOnly]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (isReadOnly) return;
        if (e.key === "Delete" || e.key === "Backspace") {
          deleteSelectedObjects();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [fabricCanvasRef.current, isReadOnly]);

    useEffect(() => {
      if (fabricCanvasRef.current && !isReadOnly) {
        fabricCanvasRef.current.freeDrawingBrush.width = brushWidth[0];
      }
    }, [brushWidth, isReadOnly]);

    // 更新画笔颜色
    useEffect(() => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
      }
    }, [brushColor]);

    // 更新画笔粗细
    useEffect(() => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.freeDrawingBrush.width = brushWidth[0];
      }
    }, [brushWidth]);

    // 切换工具
    const handleToolChange = (tool: Tool) => {
      if (!fabricCanvasRef.current || isReadOnly) return;

      setCurrentTool(tool);
      const canvas = fabricCanvasRef.current;

      switch (tool) {
        case "select":
          canvas.isDrawingMode = false;
          canvas.selection = true;
          canvas.defaultCursor = "default";
          break;
        case "pen":
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = brushColor;
          canvas.freeDrawingBrush.width = brushWidth[0];
          break;
        case "eraser":
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          canvas.freeDrawingBrush.color = "#ffffff";
          canvas.freeDrawingBrush.width = brushWidth[0] * 2;
          break;
        default:
          canvas.isDrawingMode = false;
          canvas.selection = false;
          break;
      }
    };

    // 添加矩形
    const addRectangle = () => {
      if (!fabricCanvasRef.current || isReadOnly) return;

      const rect = new fabric.Rect({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        id: nanoid().toString(),
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 2,
      });

      fabricCanvasRef.current.add(rect);
      fabricCanvasRef.current.setActiveObject(rect);

      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("drawing", { boardId, object: rect.toJSON(["id"]) });
      }
    };

    // 添加圆形
    const addCircle = () => {
      if (!fabricCanvasRef.current || isReadOnly) return;

      const circle = new fabric.Circle({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        id: nanoid().toString(),
        left: 100,
        top: 100,
        radius: 50,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 2,
      });

      fabricCanvasRef.current.add(circle);
      fabricCanvasRef.current.setActiveObject(circle);

      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("drawing", { boardId, object: circle.toJSON(["id"]) });
      }
    };

    // 添加文本
    const addText = () => {
      if (!fabricCanvasRef.current || isReadOnly) return;

      const text = new fabric.IText("双击编辑文本", {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        id: nanoid().toString(),
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 20,
        fill: brushColor,
      });

      fabricCanvasRef.current.add(text);
      fabricCanvasRef.current.setActiveObject(text);

      const socket = useSocketStore.getState().socket;
      if (socket) {
        socket.emit("drawing", { boardId, object: text.toJSON(["id"]) });
      }
    };

    // 删除选中的对象
    const deleteSelectedObjects = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas || isReadOnly) return;

      const activeObjects = canvas.getActiveObjects(); // 获取所有选中的对象
      if (activeObjects.length === 0) return;

      // 从画布上移除这些对象
      canvas.discardActiveObject();
      canvas.remove(...activeObjects);

      // 2. 提取所有被删除对象的 ID
      const deletedObjectIds = activeObjects
        .map((obj: any) => obj.id)
        .filter((id) => id);

      // 3. Emit! 发送 ID 列表
      const socket = useSocketStore.getState().socket;
      if (socket && deletedObjectIds.length > 0) {
        socket.emit("objects:removed", {
          boardId,
          objectIds: deletedObjectIds,
        });
      }
    };

    // 清空画布
    const clearCanvas = () => {
      if (isReadOnly) return;
      if (fabricCanvasRef.current) {
        const socket = useSocketStore.getState().socket;
        if (socket) {
          socket.emit("canvas:cleared", { boardId });
        }
      }
    };

    // 导出画布
    const exportCanvas = () => {
      if (fabricCanvasRef.current) {
        const dataURL = fabricCanvasRef.current.toDataURL({
          format: "png",
          quality: 1,
        });

        const link = document.createElement("a");
        link.download = "whiteboard.png";
        link.href = dataURL;
        link.click();
      }
    };

    // 导入图片
    // const importImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    //   const file = event.target.files?.[0];
    //   if (!file || !fabricCanvasRef.current) return;
    //
    //   const reader = new FileReader();
    //   reader.onload = (e) => {
    //     const imgUrl = e.target?.result as string;
    //     fabric.Image.fromURL(imgUrl, (img) => {
    //       img.scaleToWidth(200);
    //       fabricCanvasRef.current?.add(img);
    //       fabricCanvasRef.current?.renderAll();
    //     });
    //   };
    //   reader.readAsDataURL(file);
    // };

    useImperativeHandle(ref, () => ({
      saveCanvasAsJson: () => {
        if (!fabricCanvasRef.current) return;
        const jsonData = fabricCanvasRef.current.toJSON();
        // 如果父组件传入了 onSave 函数，就调用它，把数据传出去
        if (onSave) {
          onSave(jsonData);
        }
      },

      loadCanvasFromJson: (jsonData: object) => {
        if (!fabricCanvasRef.current) return;
        fabricCanvasRef.current.loadFromJSON(jsonData, () => {
          fabricCanvasRef.current?.renderAll();
        });
      },
    }));

    return (
      <div className="flex flex-col h-full">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 基础工具 */}
            <div className="flex items-center gap-1">
              <Button
                variant={currentTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("select")}
                disabled={isReadOnly}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("pen")}
                disabled={isReadOnly}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("eraser")}
                disabled={isReadOnly}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 形状工具 */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentTool("rectangle");
                  addRectangle();
                }}
                disabled={isReadOnly}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentTool("circle");
                  addCircle();
                }}
                disabled={isReadOnly}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentTool("text");
                  addText();
                }}
                disabled={isReadOnly}
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 颜色选择器 */}
            <Popover>
              <PopoverTrigger asChild disabled={isReadOnly}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Palette className="h-4 w-4" />
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: brushColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <h4 className="font-medium">选择颜色</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 ${
                          brushColor === color
                            ? "border-gray-400"
                            : "border-gray-200"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setBrushColor(color)}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">自定义颜色</label>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-full h-8 rounded border"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* 画笔粗细 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">粗细:</span>
              <div className="w-24">
                <Slider
                  value={brushWidth}
                  onValueChange={setBrushWidth}
                  max={50}
                  min={1}
                  step={1}
                  disabled={isReadOnly}
                />
              </div>
              <Badge variant="secondary" className="text-xs">
                {brushWidth[0]}px
              </Badge>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCanvas}
                disabled={isReadOnly}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 导入导出 */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={exportCanvas}>
                <Download className="h-4 w-4" />
              </Button>
              {/*<Button variant="outline" size="sm" asChild>*/}
              {/*  <label>*/}
              {/*    <Upload className="h-4 w-4" />*/}
              {/*    <input*/}
              {/*      type="file"*/}
              {/*      accept="image/*"*/}
              {/*      onChange={importImage}*/}
              {/*      className="hidden"*/}
              {/*    />*/}
              {/*  </label>*/}
              {/*</Button>*/}
            </div>
          </div>

          {/* 状态栏 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                当前工具: <Badge variant="outline">{currentTool}</Badge>
              </span>
              <span>
                颜色: <span style={{ color: brushColor }}>●</span> {brushColor}
              </span>
              <span>粗细: {brushWidth[0]}px</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isDrawing && <Badge variant="secondary">绘制中...</Badge>}
              <span>
                画布: {width} × {height}
              </span>
            </div>
          </div>
        </div>

        {/* 画布区域 */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          <div className="flex justify-center">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";

export default WhiteboardCanvas;
