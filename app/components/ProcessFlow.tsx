import { ArrowRight, CheckCircle2, Eye, Package } from "lucide-react";

export function ProcessFlow() {
  const steps = [
    {
      number: "01",
      icon: Package,
      title: "置く",
      subtitle: "レンタルスペースに配置",
      description: "借りる前に、実際の空間へ商材を配置します。",
    },
    {
      number: "02",
      icon: Eye,
      title: "確かめる",
      subtitle: "空間として成立するか判断",
      description: "サイズ感、雰囲気、機能性を現場で確認。",
    },
    {
      number: "03",
      icon: CheckCircle2,
      title: "借りる",
      subtitle: "そのままレンタル開始",
      description: "気に入ったものは、すぐにレンタルへ移行。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#0f1729] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#f59e0b] rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-6 text-white">置く → 確かめる → 借りる</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            配置して確認し、そのまま使う。
            <br />
            この流れが、空間づくりの意思決定をシンプルにします。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <div className="bg-[#252d3d] border border-white/10 rounded-xl p-8 h-full hover:border-[#f59e0b]/50 transition-all duration-300">
                  <div className="text-6xl mb-4 opacity-20">{step.number}</div>
                  <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-[#f59e0b]" />
                  </div>
                  <h3 className="text-3xl mb-2 text-[#f59e0b]">{step.title}</h3>
                  <p className="text-lg mb-4 text-gray-300">{step.subtitle}</p>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>

                {index < steps.length - 1 ? (
                  <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 z-20">
                    <ArrowRight className="w-8 h-8 text-[#f59e0b]" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="bg-[#252d3d] border border-white/10 rounded-2xl p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center">
              <div className="w-20 h-20 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[#f59e0b]" />
              </div>
              <p className="text-sm text-gray-400">事前配置</p>
            </div>
            <ArrowRight className="w-8 h-8 text-[#f59e0b] rotate-90 md:rotate-0" />
            <div className="flex-1 text-center">
              <div className="w-20 h-20 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-10 h-10 text-[#f59e0b]" />
              </div>
              <p className="text-sm text-gray-400">空間検証</p>
            </div>
            <ArrowRight className="w-8 h-8 text-[#f59e0b] rotate-90 md:rotate-0" />
            <div className="flex-1 text-center">
              <div className="w-20 h-20 bg-[#f59e0b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-[#f59e0b]" />
              </div>
              <p className="text-sm text-gray-400">レンタル開始</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
