import { CheckCircle2, Eye, Package } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

export function Solution() {
  const solutions = [
    {
      icon: Package,
      title: "レンタルスペースに事前配置",
      description: "実際の空間に商材を配置し、リアルな環境で検証できます。",
    },
    {
      icon: Eye,
      title: "実空間で成立するか確認",
      description: "サイズ感、雰囲気、導線など、図面では分からない要素を体感的に判断。",
    },
    {
      icon: CheckCircle2,
      title: "そのままレンタルへ移行",
      description: "確認して気に入ったものは、追加手続き不要でそのままご利用いただけます。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#0f1729]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1771147372799-d94991e92ce7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25mZXJlbmNlJTIwcm9vbSUyMHNldHVwJTIwZnVybml0dXJlfGVufDF8fHx8MTc3NjMzMTQxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Conference room setup"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729]/60 to-transparent" />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl mb-6 text-white">
              判断の不確実性を、
              <br />
              <span className="text-[#f59e0b]">実空間で解消します。</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              借りる前に配置して確かめる。
              <br />
              この一連の流れが、意思決定をシンプルにします。
            </p>

            <div className="space-y-8">
              {solutions.map((solution) => {
                const Icon = solution.icon;
                return (
                  <div key={solution.title} className="flex gap-4">
                    <div className="w-12 h-12 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#f59e0b]" />
                    </div>
                    <div>
                      <h3 className="text-xl mb-2 text-white">{solution.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{solution.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
