/**
 * Logo展示页面 - 预览不同尺寸和主题的Logo效果
 */
import React from 'react';
import { Logo, LogoDark } from '@/components/ui/logo';

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900">
          DocPal Logo 设计展示
        </h1>

        {/* 浅色主题 */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">浅色主题版本</h2>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* 不同尺寸 */}
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Small (sm)</h3>
                <div className="flex justify-center mb-4">
                  <Logo size="sm" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Logo size="sm" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <Logo size="sm" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Medium (md)</h3>
                <div className="flex justify-center mb-4">
                  <Logo size="md" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Logo size="md" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <Logo size="md" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Large (lg)</h3>
                <div className="flex justify-center mb-4">
                  <Logo size="lg" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Logo size="lg" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <Logo size="lg" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Extra Large (xl)</h3>
                <div className="flex justify-center mb-4">
                  <Logo size="xl" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Logo size="xl" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <Logo size="xl" variant="text-only" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 深色主题 */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">深色主题版本</h2>
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Small (sm)</h3>
                <div className="flex justify-center mb-4">
                  <LogoDark size="sm" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <LogoDark size="sm" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <LogoDark size="sm" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Medium (md)</h3>
                <div className="flex justify-center mb-4">
                  <LogoDark size="md" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <LogoDark size="md" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <LogoDark size="md" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Large (lg)</h3>
                <div className="flex justify-center mb-4">
                  <LogoDark size="lg" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <LogoDark size="lg" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <LogoDark size="lg" variant="text-only" />
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Extra Large (xl)</h3>
                <div className="flex justify-center mb-4">
                  <LogoDark size="xl" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <LogoDark size="xl" variant="icon-only" />
                  </div>
                  <div className="flex justify-center">
                    <LogoDark size="xl" variant="text-only" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 应用场景演示 */}
        <section>
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">应用场景演示</h2>
          
          {/* 导航栏示例 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-700">导航栏应用</h3>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <LogoDark size="md" />
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">功能</span>
                  <span className="text-white text-sm">价格</span>
                  <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                    开始使用
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-700">登录页面应用</h3>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-lg text-center">
                <Logo size="xl" className="mb-4" />
                <p className="text-gray-600">您的智能文档问答助手</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-700">图标单独使用</h3>
              <div className="flex items-center gap-8 p-4">
                <div className="text-center">
                  <Logo size="sm" variant="icon-only" className="mb-2" />
                  <p className="text-xs text-gray-500">小尺寸图标</p>
                </div>
                <div className="text-center">
                  <Logo size="md" variant="icon-only" className="mb-2" />
                  <p className="text-xs text-gray-500">中等尺寸图标</p>
                </div>
                <div className="text-center">
                  <Logo size="lg" variant="icon-only" className="mb-2" />
                  <p className="text-xs text-gray-500">大尺寸图标</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 设计说明 */}
        <section className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">设计说明</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">设计理念</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 🤖 机器人象征AI智能助手</li>
                <li>• 📄 文档元素体现文档处理功能</li>
                <li>• 🎨 青绿渐变色彩现代科技感</li>
                <li>• 😊 友好圆润的设计风格</li>
                <li>• 🔗 整体传达"智能文档伙伴"概念</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4 text-gray-700">技术特点</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 📱 响应式设计，适配各种尺寸</li>
                <li>• 🌗 支持浅色和深色主题</li>
                <li>• 🎯 多种变体：完整、图标、文字</li>
                <li>• 🎨 CSS渐变色彩，现代美观</li>
                <li>• ⚡ SVG矢量图形，高清缩放</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}