import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, FileText, MessageSquare, Zap, Shield, Users, Star, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { Logo, LogoDark } from '@/components/ui/logo';

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/app');
  };

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: "多格式文档支持",
      description: "支持PDF、DOCX、TXT等多种格式，智能解析文档内容"
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI智能问答",
      description: "基于先进的RAG技术，提供精准的文档问答服务"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "极速检索",
      description: "向量化搜索技术，毫秒级响应您的查询请求"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "企业级安全",
      description: "数据加密存储，支持私有化部署，确保信息安全"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "团队协作",
      description: "多用户权限管理，支持团队知识共享与协作"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "友好交互",
      description: "类ChatGPT的对话界面，自然语言交互体验"
    }
  ];

  const testimonials = [
    {
      name: "张总监",
      role: "技术总监",
      company: "某科技公司",
      content: "DocPal大大提升了我们团队的文档管理效率，再也不用在海量文档中翻找信息了。",
      avatar: "👨‍💼"
    },
    {
      name: "李经理",
      role: "产品经理",
      company: "某咨询公司",
      content: "智能问答功能非常准确，帮助我们快速定位客户需要的信息，提升了服务质量。",
      avatar: "👩‍💼"
    },
    {
      name: "王研究员",
      role: "研究员",
      company: "某研究院",
      content: "对于学术研究来说，DocPal是一个得力助手，能够快速检索相关文献资料。",
      avatar: "👨‍🔬"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 px-6 py-4 bg-white border-b border-[#202020]/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Logo size="lg" />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[#202020] hover:text-[#ea2804] transition-colors">功能特色</a>
            <a href="#pricing" className="text-[#202020] hover:text-[#ea2804] transition-colors">价格方案</a>
            <a href="#testimonials" className="text-[#202020] hover:text-[#ea2804] transition-colors">客户评价</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="link" onClick={() => setLocation('/login')}>
              登录
            </Button>
            <Button onClick={handleGetStarted}>
              免费试用
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Gradient Blaze */}
      <section className="relative px-6 py-24 md:py-32 overflow-hidden bg-gradient-to-r from-[#ea2804] via-[#dd4425] to-[#e91e9c]">
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Main Heading */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-10 leading-none tracking-tight"
            style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
          >
            AI驱动的
            <span className="block mt-2">智能文档问答</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            上传您的文档，让AI帮您快速找到答案。
            基于先进的RAG技术，为您的团队和客户提供即时、精准的文档问答服务。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-[#202020] text-[#fcfcfc] hover:bg-[#202020]/90 px-8 py-4 text-lg font-semibold"
              onClick={handleGetStarted}
            >
              <Zap className="h-5 w-5 mr-2" />
              立即开始使用
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20 px-8 py-4 text-lg"
              onClick={() => setLocation('/login')}
            >
              了解更多
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 text-white/60">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm">深受 1000+ 用户信赖</span>
          </div>
        </div>
      </section>

      {/* Features Section - White */}
      <section id="features" className="px-6 py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-4xl md:text-5xl font-bold text-[#202020] mb-6 leading-tight"
              style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
            >
              为什么选择 <span className="text-[#ea2804]">DocPal</span>
            </h2>
            <p className="text-lg text-[#646464] max-w-3xl mx-auto">
              我们将最先进的AI技术与直观的用户体验相结合，让文档管理变得前所未有的简单
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-[32px] border border-[#202020]/10 hover:border-[#ea2804] transition-all duration-300">
                <div className="text-[#ea2804] mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#202020] mb-3">{feature.title}</h3>
                <p className="text-[#646464] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Dark Section */}
      <section className="px-6 py-24 md:py-32 bg-[#202020]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
              style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
            >
              三步开始使用
            </h2>
            <p className="text-lg text-white/60">
              简单三步，让您的文档变成智能助手
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "上传文档",
                description: "将您的PDF、DOCX或TXT文档上传到DocPal平台"
              },
              {
                step: "02",
                title: "AI处理",
                description: "我们的AI会自动解析、分块并向量化您的文档内容"
              },
              {
                step: "03",
                title: "智能问答",
                description: "通过自然语言提问，获得基于文档内容的精准答案"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#ea2804] rounded-full flex items-center justify-center text-white font-bold text-lg mb-6 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{item.title}</h3>
                <p className="text-white/60">{item.description}</p>
                {index < 2 && (
                  <ArrowRight className="h-6 w-6 text-white/20 mx-auto mt-6 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - White */}
      <section id="testimonials" className="px-6 py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2
              className="text-4xl md:text-5xl font-bold text-[#202020] mb-6 leading-tight"
              style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
            >
              客户怎么说
            </h2>
            <p className="text-lg text-[#646464]">
              来自真实用户的反馈
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 bg-white rounded-[32px] border border-[#202020]/10">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-[#4e4e4e] mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div>
                    <div className="text-[#202020] font-semibold">{testimonial.name}</div>
                    <div className="text-[#8d8d8d] text-sm">{testimonial.role} · {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto / CTA Section - Dark */}
      <section className="px-6 py-24 md:py-32 bg-[#202020]">
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-10 leading-none"
            style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
          >
            让您的文档<br />变得智能
          </h2>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
            加入已经在使用DocPal的数千用户，体验AI驱动的文档问答服务
          </p>
          <Button
            size="lg"
            className="bg-white text-[#202020] hover:bg-white/90 px-8 py-4 text-lg font-semibold"
            onClick={handleGetStarted}
          >
            <Zap className="h-5 w-5 mr-2" />
            开始免费试用
          </Button>
          <p className="text-white/40 text-sm mt-6">
            免费试用 · 无需信用卡 · 随时取消
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-[#202020] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <LogoDark size="md" />
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-[#bbbbbb] hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="text-[#bbbbbb] hover:text-white transition-colors">服务条款</a>
              <a href="#" className="text-[#bbbbbb] hover:text-white transition-colors">联系我们</a>
            </div>
          </div>
          <div className="text-center text-[#8d8d8d] text-sm mt-8">
            © 2024 DocPal. 保留所有权利.
          </div>
        </div>
      </footer>
    </div>
  );
}
