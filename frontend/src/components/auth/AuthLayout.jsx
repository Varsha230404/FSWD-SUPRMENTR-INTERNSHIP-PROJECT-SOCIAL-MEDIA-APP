import { HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineHeart } from 'react-icons/hi';

const FEATURES = [
  { icon: HiOutlineSparkles, title: 'Share your moments', text: 'Post photos, stories, and thoughts with people who matter.' },
  { icon: HiOutlineLightningBolt, title: 'Real-time feed', text: 'Stay updated with instant feeds and notifications.' },
  { icon: HiOutlineHeart, title: 'Build your community', text: 'Follow creators, connect with friends, discover voices.' },
];

export default function AuthLayout({ children, mode = 'login' }) {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <div className="relative hidden lg:flex flex-1 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 auth-gradient-anim" />

        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-white/10 blur-3xl animate-blob-1" />
        <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-sky-300/20 blur-3xl animate-blob-2" />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-400/15 blur-3xl animate-blob-3" />

        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />

        <div className="relative z-10 max-w-md px-12 text-white">
          <div className="flex items-center gap-3 mb-10 animate-auth-up" style={{ animationDelay: '0.05s' }}>
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <span className="text-xl font-bold">V</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Vibe</span>
          </div>

          <h2 className="text-[42px] leading-[1.05] font-bold tracking-tight mb-4 animate-auth-up" style={{ animationDelay: '0.15s' }}>
            {mode === 'register' ? (
              <>
                Join the vibe.<br />
                <span className="text-white/80">Create. Share. Connect.</span>
              </>
            ) : (
              <>
                Welcome back.<br />
                <span className="text-white/80">Your feed is waiting.</span>
              </>
            )}
          </h2>

          <p className="text-white/75 text-[15px] mb-10 leading-relaxed max-w-sm animate-auth-up" style={{ animationDelay: '0.25s' }}>
            A social space built for authentic connections — minimal, fast, and beautifully crafted.
          </p>

          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="flex items-start gap-3.5 animate-auth-up"
                style={{ animationDelay: `${0.35 + i * 0.08}s` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{f.title}</p>
                  <p className="text-[13px] text-white/70 leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-12 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-auth-up"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="flex items-center gap-1 mb-2 text-yellow-300 text-sm">
              {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <p className="text-sm text-white/90 leading-relaxed italic">
              "Vibe feels different. It's quiet, clean, and made for real conversations."
            </p>
            <p className="text-xs text-white/60 mt-2">— Aadhya, beta user</p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 py-8 sm:p-8 md:p-10 bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
        <div className="lg:hidden absolute -top-32 -right-20 w-72 h-72 rounded-full auth-gradient-anim opacity-20 blur-3xl" />
        <div className="lg:hidden absolute -bottom-32 -left-20 w-72 h-72 rounded-full auth-gradient-anim opacity-15 blur-3xl" />

        <div className="relative z-10 w-full max-w-[420px] animate-auth-right">
          {children}
        </div>
      </div>
    </div>
  );
}
