import { AlertCircle, HelpCircle, XCircle } from "lucide-react";

export function Problems() {
  const problems = [
    {
      icon: HelpCircle,
      title: "図面や写真だけでは判断できない",
      description: "2D情報では実際の空間イメージが掴めず、導入後のギャップが不安。",
    },
    {
      icon: AlertCircle,
      title: "実際に置いたときのイメージが分からない",
      description: "商材が空間に馴染むか、サイズ感や雰囲気が合うか確信が持てない。",
    },
    {
      icon: XCircle,
      title: "導入後のミスマッチが不安",
      description: "一度導入すると変更が難しく、意思決定に踏み切れない。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#1a2332]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-white">こんな課題、ありませんか？</h2>
          <p className="text-xl text-gray-400">空間導入における、よくある判断の壁</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className="bg-[#252d3d] border border-white/10 rounded-xl p-8 hover:border-[#f59e0b]/50 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-[#f59e0b]" />
                </div>
                <h3 className="text-xl mb-4 text-white">{problem.title}</h3>
                <p className="text-gray-400 leading-relaxed">{problem.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
