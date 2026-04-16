import { CheckSquare, Gauge, Minimize2, TrendingUp } from "lucide-react";

export function Benefits() {
  const benefits = [
    {
      icon: CheckSquare,
      title: "判断の不確実性を減らせる",
      description:
        "実際の空間で商材を確認することで、想像と現実のギャップをなくし、確信を持った意思決定が可能に。",
    },
    {
      icon: Minimize2,
      title: "空間単位で検証できる",
      description:
        "単品ではなく、空間全体としての調和や機能性を確認。トータルコーディネートの精度が向上します。",
    },
    {
      icon: Gauge,
      title: "導入判断が速くなる",
      description:
        "事前検証により社内承認がスムーズに。長い検討期間や会議を削減し、スピーディな導入が実現します。",
    },
    {
      icon: TrendingUp,
      title: "小さく試して拡張できる",
      description:
        "1点からスタートし、効果を確認しながら段階的に拡大。リスクを抑えた柔軟な導入が可能です。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#1a2332]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-white">導入のメリット</h2>
          <p className="text-xl text-gray-400">事前配置による、確実な意思決定支援</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="bg-[#252d3d] border border-white/10 rounded-xl p-8 hover:border-[#f59e0b]/50 hover:shadow-lg hover:shadow-[#f59e0b]/10 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-[#f59e0b]" />
                </div>
                <h3 className="text-2xl mb-4 text-white">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
