import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-[#ea2804]" />
            <h1
              className="text-2xl font-bold text-[#202020]"
              style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
            >
              404 页面未找到
            </h1>
          </div>

          <p className="mt-4 text-sm text-[#646464]">
            您访问的页面不存在或已被移动。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
