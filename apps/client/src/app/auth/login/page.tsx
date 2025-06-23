"use client";

import React from "react";
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Users } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { axios_instance } from "@/config/configuration";
import { useUserStore } from "@/stores/user-store";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const setUserInfo = useUserStore((state) => state.setUserInfo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!loginForm.username.trim()) {
      newErrors.username = "用户名不能为空";
    }
    if (!loginForm.password) {
      newErrors.password = "密码不能为空";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await axios_instance.post("/auth/login", {
          username: loginForm.username,
          password: loginForm.password,
          turnstileToken: turnstileToken,
        });

        if (response.data.message === "success") {
          const profile = await axios_instance.get("/auth/profile");
          setUserInfo({
            id: profile.data.sub,
            username: profile.data.username,
          });

          setLoginForm({ username: "", password: "" });
          toast.success("Login successful");
          router.push("/home");
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Unknown error");
        }
      } finally {
        // todo：重置 Turnstile 验证
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* 头部品牌区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Users className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">协作白板</h1>
          <p className="text-muted-foreground mt-1">开始你的创意协作之旅</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>登录你的账户继续使用协作白板</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  className={errors.username ? "border-destructive" : ""}
                />
                {errors.username && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.username}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className={
                      errors.password ? "border-destructive pr-10" : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.password}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
                  options={{ size: "flexible" }}
                  onSuccess={(token) => setTurnstileToken(token)}
                />
              </div>

              <Button type="submit" className="w-full">
                登录
              </Button>
            </form>

            <div className="space-y-4">
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm text-muted-foreground"
                >
                  忘记密码？
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或者
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  还没有账户？
                </span>
                <Link href="/auth/register">
                  <Button variant="link" className="text-sm font-medium">
                    立即注册
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          © 2025 协作白板. 保留所有权利.
        </div>
      </div>
    </div>
  );
}
