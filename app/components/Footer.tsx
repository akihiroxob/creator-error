export function Footer() {
  return (
    <footer className="bg-[#0f1729] border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl mb-4 text-[#f59e0b]">Service Name</h3>
            <p className="text-gray-400 leading-relaxed">
              置いてみる。確かめる。借りられる。
              <br />
              空間検証型レンタルサービス
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-white">サービス</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">導入相談</li>
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">空間検証</li>
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">
                レンタルプラン
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white">企業情報</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">会社概要</li>
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">利用規約</li>
              <li className="hover:text-[#f59e0b] cursor-pointer transition-colors">
                プライバシーポリシー
              </li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="mb-4 text-gray-400">運営会社</h4>
            <div className="text-gray-400 mb-4 flex flex-col gap-1">
              <a
                href="https://www.jyunichik.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f59e0b] cursor-pointer transition-colors flex items-center gap-1"
              >
                <img
                  src="/img/logo.png"
                  alt="クリエイターエラー株式会社"
                  className="inline-block h-6 w-auto"
                />
                クリエイターエラー株式会社
              </a>
              東京都渋谷区神南1-20-5 VORT渋谷brilliaビル 4F
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-gray-500">
          <p>© 2026 SpaceVerify. Operated by creator error. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
