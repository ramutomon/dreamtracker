import { useUser } from '../context/UserContext'

export default function Login() {
  const { signInWithGoogle } = useUser()

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-8">

        {/* ロゴ */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-brand-orange">Dream</span>
            <span className="text-white">Tracker</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">ドリームトラッカー — 夢を叶えることに全力を</p>
        </div>

        {/* キャッチコピー */}
        <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-5">
          <p className="text-white/80 text-base leading-relaxed">
            「やりたいことを残して死ぬのは、<br />
            人生を使い切れなかった証拠だ」
          </p>
          <p className="text-white/30 text-xs mt-3">
            健康寿命・バケットリスト・体験予算を一元管理して<br />
            後悔のない人生を設計しよう。
          </p>
        </div>

        {/* Google サインインボタン */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 px-6 rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 shadow-lg"
        >
          {/* Google ロゴ（SVG） */}
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.552c0-1.636-.132-3.2-.38-4.704H24.48v8.896h12.944c-.556 3.004-2.236 5.552-4.768 7.268v6.04h7.716c4.512-4.156 7.16-10.276 7.16-17.5z" fill="#4285F4"/>
            <path d="M24.48 48c6.48 0 11.92-2.148 15.892-5.816l-7.716-6.04c-2.148 1.44-4.896 2.292-8.176 2.292-6.284 0-11.608-4.244-13.512-9.948H3.012v6.228C6.968 43.2 15.12 48 24.48 48z" fill="#34A853"/>
            <path d="M10.968 28.488A14.372 14.372 0 0 1 10.2 24c0-1.564.268-3.08.768-4.488v-6.228H3.012A23.946 23.946 0 0 0 .48 24c0 3.868.928 7.528 2.532 10.716l7.956-6.228z" fill="#FBBC05"/>
            <path d="M24.48 9.564c3.544 0 6.72 1.22 9.224 3.608l6.908-6.908C36.392 2.392 30.96 0 24.48 0 15.12 0 6.968 4.8 3.012 11.772l7.956 6.228c1.904-5.704 7.228-8.436 13.512-8.436z" fill="#EA4335"/>
          </svg>
          Googleでサインイン
        </button>

        <p className="text-white/20 text-xs">
          サインインすることで、どのデバイスからでもデータにアクセスできます。
        </p>
      </div>
    </div>
  )
}
