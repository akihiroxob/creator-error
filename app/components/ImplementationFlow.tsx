import { MapPin, MessageSquare, Pencil, Rocket } from "lucide-react";

export function ImplementationFlow() {
  const steps = [
    {
      icon: MessageSquare,
      title: "導入相談",
      description:
        "商材の種類、数量、検証したい空間イメージなどをヒアリング。最適なプランをご提案します。",
    },
    {
      icon: Pencil,
      title: "設置プラン設計",
      description:
        "レンタルスペースの選定と配置レイアウトを設計。事前に図面で確認いただけます。",
    },
    {
      icon: MapPin,
      title: "試し置き",
      description:
        "実際の空間に商材を配置。現地で確認し、必要に応じて配置の調整も可能です。",
    },
    {
      icon: Rocket,
      title: "レンタル開始",
      description:
        "検証結果に満足いただけたら、そのままレンタル契約へ。追加手続きは不要です。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#1a2332]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-white">導入フロー</h2>
          <p className="text-xl text-gray-400">相談から開始まで、4つのステップ</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-[#252d3d] border border-white/10 rounded-xl p-8 hover:border-[#f59e0b]/50 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4 md:flex-col md:items-start">
                      <div className="flex items-center justify-center w-16 h-16 bg-[#f59e0b]/10 rounded-xl flex-shrink-0">
                        <Icon className="w-8 h-8 text-[#f59e0b]" />
                      </div>
                      <div className="text-5xl opacity-20 hidden md:block">0{index + 1}</div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-2xl md:hidden opacity-20">0{index + 1}</span>
                        <h3 className="text-2xl text-white">{step.title}</h3>
                      </div>
                      <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
