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
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Square,
  Circle,
  Type,
  MousePointer,
} from "lucide-react";

interface WhiteboardCanvasProps {
  width?: number;
  height?: number;
  onSave?: (data: object) => void;
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
  ({ width = 1200, height = 800, onSave }: WhiteboardCanvasProps, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [currentTool, setCurrentTool] = useState<Tool>("pen");
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushWidth, setBrushWidth] = useState([5]);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
      if (!canvasRef.current) return;

      // 初始化fabric.js画布
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
      });

      fabricCanvasRef.current = canvas;

      // 设置初始绘图模式
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth[0];

      // 监听绘图事件
      canvas.on("path:created", () => {
        setIsDrawing(false);
      });

      canvas.on("mouse:down", () => {
        setIsDrawing(true);
      });

      canvas.on("mouse:up", () => {
        setIsDrawing(false);
      });

      return () => {
        canvas.dispose();
      };
    }, []);

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
      if (!fabricCanvasRef.current) return;

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
      if (!fabricCanvasRef.current) return;

      const rect = new fabric.Rect({
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
    };

    // 添加圆形
    const addCircle = () => {
      if (!fabricCanvasRef.current) return;

      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 2,
      });

      fabricCanvasRef.current.add(circle);
      fabricCanvasRef.current.setActiveObject(circle);
    };

    // 添加文本
    const addText = () => {
      if (!fabricCanvasRef.current) return;

      const text = new fabric.IText("双击编辑文本", {
        left: 100,
        top: 100,
        fontFamily: "Arial",
        fontSize: 20,
        fill: brushColor,
      });

      fabricCanvasRef.current.add(text);
      fabricCanvasRef.current.setActiveObject(text);
    };

    // 清空画布
    const clearCanvas = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.backgroundColor = "#ffffff";
        fabricCanvasRef.current.renderAll();
      }
    };

    // 撤销
    const undo = () => {
      if (fabricCanvasRef.current) {
        const objects = fabricCanvasRef.current.getObjects();
        if (objects.length > 0) {
          fabricCanvasRef.current.remove(objects[objects.length - 1]);
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
    const importImage = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !fabricCanvasRef.current) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        fabric.Image.fromURL(imgUrl, (img) => {
          img.scaleToWidth(200);
          fabricCanvasRef.current?.add(img);
          fabricCanvasRef.current?.renderAll();
        });
      };
      reader.readAsDataURL(file);
    };

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
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("pen")}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => handleToolChange("eraser")}
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
              >
                <Type className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 颜色选择器 */}
            <Popover>
              <PopoverTrigger asChild>
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
                />
              </div>
              <Badge variant="secondary" className="text-xs">
                {brushWidth[0]}px
              </Badge>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={undo}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* 导入导出 */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={exportCanvas}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={importImage}
                    className="hidden"
                  />
                </label>
              </Button>
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
