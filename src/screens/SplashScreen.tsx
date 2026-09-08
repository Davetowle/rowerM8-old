const LOGO = "./yNl_fM1QANg5x3G8U2K43-LdmJV3rvmFV9UjdEyZRnQ-zq1sSniTjS4h297hyV3x0mz5tsjsy_WsQ3Nx.jpg";

export function SplashScreen() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-slate-950 bg-cover bg-center"
      style={{ backgroundImage: `url('${LOGO}')` }}
    >
      <div className="absolute inset-0 bg-slate-950/65" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/70" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-safe-6 pt-safe-8 pb-safe-8 text-center">
        <div className="animate-splash-in">
          <p className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">strokeM8</p>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.28em] text-cyan-100/80">
            Find your rhythm
          </p>
          <div className="mx-auto mt-8 h-1 w-14 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-1/2 animate-splash-progress rounded-full bg-cyan-300" />
          </div>
        </div>
      </div>
    </main>
  );
}
