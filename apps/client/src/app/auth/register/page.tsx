"use client";

import type React from "react";
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

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!registerForm.username.trim()) {
      newErrors.username = "用户名不能为空";
    } else if (registerForm.username.length < 3) {
      newErrors.username = "用户名至少需要3个字符";
    }

    if (!registerForm.password) {
      newErrors.password = "密码不能为空";
    } else if (registerForm.password.length < 6) {
      newErrors.password = "密码至少需要6个字符";
    }

    if (!registerForm.confirmPassword) {
      newErrors.confirmPassword = "请确认密码";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    if (!turnstileToken) {
      newErrors.turnstile = "验证失败，请重试";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const data = await axios.post("/auth/register", {
          username: registerForm.username,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
          turnstileToken: turnstileToken,
        });

        console.log(data);
        setRegisterForm({ confirmPassword: "", username: "", password: "" });
        toast.success("Register successful");
        router.push("/login");
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Unknown error");
        }
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
            <CardTitle className="text-2xl">创建账户</CardTitle>
            <CardDescription>注册新账户开始使用协作白板</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
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
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        password: e.target.value,
                      })
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
                <Label htmlFor="confirm-password">确认密码</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="请再次输入密码"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={
                      errors.confirmPassword
                        ? "border-destructive pr-10"
                        : "pr-10"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-sm">
                      {errors.confirmPassword}
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
                注册账户
              </Button>
            </form>

            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                注册即表示你同意我们的
                <Button variant="link" className="p-0 h-auto text-sm">
                  服务条款
                </Button>
                和
                <Button variant="link" className="p-0 h-auto text-sm">
                  隐私政策
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
                  已有账户？
                </span>
                <Link href="/auth/login">
                  <Button variant="link" className="text-sm font-medium">
                    立即登录
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
