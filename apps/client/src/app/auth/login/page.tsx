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
import { Eye, EyeOff, Users, Zap, Shield, Globe } from "lucide-react";
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
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-purple-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-indigo-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-pink-200/30 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* 网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <div className="relative z-10 min-h-screen flex">
        {/* 左侧信息面板 */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <div className="max-w-md">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Co Draw
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              协作创新，
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                共创未来
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              加入数千家企业的选择，体验最先进的在线协作平台，让团队创意无界限。
            </p>

            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-4">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">实时协作</h3>
                  <p className="text-gray-600 text-sm">
                    多人同时编辑，实时同步更新
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-4">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">企业级安全</h3>
                  <p className="text-gray-600 text-sm">
                    银行级加密，保护您的数据安全
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-4">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">全球访问</h3>
                  <p className="text-gray-600 text-sm">
                    随时随地，跨设备无缝协作
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* 移动端品牌区域 */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Co Draw
              </h1>
              <p className="text-gray-600 mt-1">开始你的创意协作之旅</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  欢迎回来
                </CardTitle>
                <CardDescription className="text-gray-600">
                  登录你的账户继续协作
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-gray-700 font-medium"
                    >
                      用户名
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="请输入用户名"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, username: e.target.value })
                      }
                      className={`h-12 border-2 transition-all duration-200 ${
                        errors.username
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
                      } bg-white/50`}
                    />
                    {errors.username && (
                      <Alert
                        variant="destructive"
                        className="py-2 bg-red-50 border-red-200"
                      >
                        <AlertDescription className="text-sm text-red-600">
                          {errors.username}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-gray-700 font-medium"
                    >
                      密码
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入密码"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        className={`h-12 border-2 pr-12 transition-all duration-200 ${
                          errors.password
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
                        } bg-white/50`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <Alert
                        variant="destructive"
                        className="py-2 bg-red-50 border-red-200"
                      >
                        <AlertDescription className="text-sm text-red-600">
                          {errors.password}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Turnstile
                      siteKey={
                        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string
                      }
                      options={{ size: "flexible" }}
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    登录
                  </Button>
                </form>

                <div className="space-y-4">
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      忘记密码？
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-gray-500 font-medium">
                        或者
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-sm text-gray-600">还没有账户？</span>
                    <Link href="/auth/register">
                      <Button
                        variant="link"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        立即注册
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-gray-500">
              © 2025 Co Draw. 保留所有权利.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
