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
import { Eye, EyeOff, Users, Zap, Shield, CheckCircle } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { axios_instance } from "@/config/configuration";

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
        const data = await axios_instance.post("/auth/register", {
          username: registerForm.username,
          password: registerForm.password,
          confirmPassword: registerForm.confirmPassword,
          turnstileToken: turnstileToken,
        });

        console.log(data);
        setRegisterForm({ confirmPassword: "", username: "", password: "" });
        toast.success("Register successful");
        router.push("/auth/login");
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
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-200/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-blue-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-purple-200/30 rounded-full blur-xl"></div>
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
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl mr-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Co Draw
              </h1>
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
              开启协作，
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                创造无限
              </span>
            </h2>

            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              加入我们的创新平台，与全球团队一起协作，将创意转化为现实。
            </p>

            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg mr-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">免费开始</h3>
                  <p className="text-gray-600 text-sm">
                    无需信用卡，立即体验完整功能
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-4">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">快速上手</h3>
                  <p className="text-gray-600 text-sm">
                    直观界面，5分钟即可掌握
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-4">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">数据安全</h3>
                  <p className="text-gray-600 text-sm">
                    端到端加密，隐私完全保护
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100">
              <p className="text-sm text-gray-600 mb-2">已有超过</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">50,000+</p>
              <p className="text-sm text-gray-600">团队选择我们的协作平台</p>
            </div>
          </div>
        </div>

        {/* 右侧注册表单 */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* 移动端品牌区域 */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Co Draw
              </h1>
              <p className="text-gray-600 mt-1">开始你的创意协作之旅</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  创建账户
                </CardTitle>
                <CardDescription className="text-gray-600">
                  注册新账户开始协作
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
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          username: e.target.value,
                        })
                      }
                      className={`h-12 border-2 transition-all duration-200 ${
                        errors.username
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-emerald-500 hover:border-gray-300"
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
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        className={`h-12 border-2 pr-12 transition-all duration-200 ${
                          errors.password
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-emerald-500 hover:border-gray-300"
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
                    <Label
                      htmlFor="confirm-password"
                      className="text-gray-700 font-medium"
                    >
                      确认密码
                    </Label>
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
                        className={`h-12 border-2 pr-12 transition-all duration-200 ${
                          errors.confirmPassword
                            ? "border-red-300 focus:border-red-500"
                            : "border-gray-200 focus:border-emerald-500 hover:border-gray-300"
                        } bg-white/50`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <Alert
                        variant="destructive"
                        className="py-2 bg-red-50 border-red-200"
                      >
                        <AlertDescription className="text-sm text-red-600">
                          {errors.confirmPassword}
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
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    注册账户
                  </Button>
                </form>

                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-600 leading-relaxed">
                    注册即表示你同意我们的
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      服务条款
                    </Button>
                    和
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      隐私政策
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
                    <span className="text-sm text-gray-600">已有账户？</span>
                    <Link href="/auth/login">
                      <Button
                        variant="link"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        立即登录
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
