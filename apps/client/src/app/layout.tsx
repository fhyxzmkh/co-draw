"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useState } from "react";
import { axios_instance } from "@/config/configuration";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 全局的加载动画组件
function AppLoader() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isLoading, setIsLoading] = useState(true);

  const setUserInfo = useUserStore((state) => state.setUserInfo);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const profile = await axios_instance.get("/auth/profile");
        setUserInfo({
          id: profile.data.sub,
          username: profile.data.username,
        });

        toast.info("欢迎回来！");
      } catch (error: unknown) {
        console.log("No active session or session expired.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, [setUserInfo]);

  if (isLoading) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <AppLoader />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
