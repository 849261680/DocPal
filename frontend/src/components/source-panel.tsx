import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, BookOpen, BarChart3 } from "lucide-react";

interface SourceItem {
  id: string;
  title: string;
  type: string;
  relevance: number;
  content: string;
  page?: number;
  section?: string;
}

export default function SourcePanel() {
  const [selectedSources, setSelectedSources] = useState<SourceItem[]>([]);

  const mockSources: SourceItem[] = [
    {
      id: "1",
      title: "产品需求文档v2.1.pdf",
      type: "PDF",
      relevance: 95,
      content: "用户体验改进是本次产品迭代的核心目标，需要从界面设计、交互流程、响应速度等多个维度进行优化...",
      page: 15,
      section: "段落3"
    },
    {
      id: "2",
      title: "用户反馈汇总.xlsx",
      type: "Excel",
      relevance: 88,
      content: "用户反馈中62%的意见集中在页面加载速度过慢，建议控制在2秒以内，同时需要基于用户行为数据提供个性化推荐...",
      page: undefined,
      section: "Sheet1 • 行27-35"
    },
    {
      id: "3",
      title: "竞品分析报告.docx",
      type: "Word",
      relevance: 76,
      content: "竞品在用户体验方面的优势主要体现在个性化推荐系统和响应速度优化，建议我们在推荐算法方面加大投入...",
      page: undefined,
      section: "第8页 • 竞品对比章节"
    }
  ];

  return (
    <aside className="w-80 bg-white border-l border-[#202020]/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#202020]/10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-[#ea2804]" />
          <h2 className="font-semibold text-[#202020]">引用来源</h2>
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mockSources.map((source, index) => (
            <Card key={source.id} className="p-3 hover:border-[#ea2804] transition-colors border-l-4 border-l-[#ea2804]">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[#ea2804]/10 rounded-full flex items-center justify-center">
                    <span className="text-[#ea2804] font-semibold text-sm">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-[#8d8d8d]" />
                    <span className="text-sm font-medium text-[#202020] truncate">
                      {source.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#646464] mb-2 line-clamp-3">
                    "{source.content}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8d8d8d]">
                      {source.section}
                    </span>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-[#2b9a66]" />
                      <span className="text-xs font-medium text-[#2b9a66]">
                        {source.relevance}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </aside>
  );
}
