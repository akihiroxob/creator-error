"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "どんなものが置けますか？",
      answer:
        "家具、什器、インテリア雑貨、撮影備品、展示用品など、レンタルスペースに持ち込み可能なものであれば幅広く対応可能です。サイズや重量に制限がある場合もございますので、まずはお気軽にご相談ください。事前に図面や写真をお送りいただければ、より正確なご提案が可能です。",
    },
    {
      question: "少量からでも始められますか？",
      answer:
        "はい、1点からでも対応可能です。小規模なテスト配置から始めて、効果を確認しながら段階的に拡大していくことも可能です。初めてのご利用でも安心してスタートできるよう、担当者が丁寧にサポートいたします。",
    },
    {
      question: "貸出条件はどう決まりますか？",
      answer:
        "商材の種類、数量、配置期間、レンタルスペースの立地などによって条件が決まります。試し置き期間中に気に入った場合、そのままレンタル契約へ移行できますので、改めて運搬や設置の手間がかかりません。詳細な条件については、導入相談時に個別にお見積もりをご提示いたします。",
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#1a2332]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4 text-white">よくあるご質問</h2>
          <p className="text-xl text-gray-400">FAQ</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="bg-[#252d3d] border border-white/10 rounded-xl overflow-hidden hover:border-[#f59e0b]/30 transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <h3 className="text-xl text-white pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`w-6 h-6 text-[#f59e0b] flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-8 pb-6 text-gray-400 leading-relaxed">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
