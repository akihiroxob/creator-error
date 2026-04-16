import { Briefcase, Camera, Sparkles, Users } from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

export function UseCases() {
  const cases = [
    {
      icon: Camera,
      title: "撮影スタジオのレイアウト検証",
      description: "撮影備品や背景セットを事前配置し、撮影に最適な空間構成を確認。",
      image:
        "https://images.unsplash.com/photo-1759417501792-0d188b64b774?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxldmVudCUyMHNwYWNlJTIwc3R1ZGlvJTIwbGF5b3V0fGVufDF8fHx8MTc3NjMzMTQxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Sparkles,
      title: "イベント空間の什器確認",
      description: "展示什器やディスプレイ什器を実際に配置し、来場者動線や視認性を検証。",
      image:
        "https://images.unsplash.com/photo-1761393640368-a55da29a3346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBpbnRlcmlvciUyMHBsYW5uaW5nfGVufDF8fHx8MTc3NjMzMTQxNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Briefcase,
      title: "会議スペースの家具配置検討",
      description: "デスク、チェア、収納の配置を試し、業務効率と快適性を両立する空間を実現。",
      image:
        "https://images.unsplash.com/photo-1745847768392-ec7b783209a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrc3BhY2UlMjBmdXJuaXR1cmUlMjBhcnJhbmdlbWVudHxlbnwxfHx8fDE3NzYzMzE0MTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      icon: Users,
      title: "新商品の空間フィット検証",
      description: "新製品やプロトタイプを実環境に設置し、市場投入前の最終確認を実施。",
      image:
        "https://images.unsplash.com/photo-1764726331220-b323be2b57b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMHN0dWRpbyUyMHNwYWNlJTIwdmVudWV8ZW58MXx8fHwxNzc2MzMxNDE1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#0f1729]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-white">活用シーン</h2>
          <p className="text-xl text-gray-400">さまざまな業種・用途で、空間検証を実現</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cases.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <div
                key={useCase.title}
                className="group bg-[#252d3d] border border-white/10 rounded-xl overflow-hidden hover:border-[#f59e0b]/50 transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <ImageWithFallback
                    src={useCase.image}
                    alt={useCase.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#252d3d] via-[#252d3d]/50 to-transparent" />
                  <div className="absolute top-6 left-6 w-14 h-14 bg-[#f59e0b]/90 rounded-xl flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#0f1729]" />
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl mb-3 text-white">{useCase.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{useCase.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
