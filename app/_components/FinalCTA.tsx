import { ArrowRight, Mail, Phone } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="contact" className="py-24 md:py-32 bg-gradient-to-b from-[#0f1729] to-[#1a2332]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl mb-6 text-white">
          まずは1点からでも、
          <br />
          <span className="text-[#f59e0b]">ご相談ください。</span>
        </h2>

        <p className="text-xl text-gray-300 mb-12 leading-relaxed">
          どのような配置が最適か、導入前の検討からご相談いただけます。
          <br />
          経験豊富な担当者が、空間づくりの意思決定をサポートいたします。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a
            href="#contact"
            className="group px-10 py-5 bg-[#f59e0b] text-[#0f1729] rounded-lg hover:bg-[#fbbf24] transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Mail className="w-5 h-5" />
            <span className="text-lg">導入相談を始める</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="tel:03-XXXX-XXXX"
            className="px-10 py-5 border-2 border-[#f59e0b] text-[#f59e0b] rounded-lg hover:bg-[#f59e0b]/10 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Phone className="w-5 h-5" />
            <span className="text-lg">お電話でのお問い合わせ</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <div className="bg-[#252d3d] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-[#f59e0b]" />
              <span className="text-gray-400">メール</span>
            </div>
            <p className="text-white">contact@example.com</p>
          </div>
          <div className="bg-[#252d3d] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-[#f59e0b]" />
              <span className="text-gray-400">電話</span>
            </div>
            <p className="text-white">03-XXXX-XXXX</p>
            <p className="text-sm text-gray-400 mt-1">平日 9:00-18:00</p>
          </div>
        </div>
      </div>
    </section>
  );
}
