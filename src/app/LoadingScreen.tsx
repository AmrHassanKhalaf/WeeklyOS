import { WeeklyOSLogo } from '../components/brand/WeeklyOSLogo'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="flex flex-col items-center gap-5 animate-fade-up relative z-10">
        <div className="relative w-14 h-14">
          <WeeklyOSLogo className="absolute inset-0 rounded-2xl" />
          <div className="absolute -inset-2 rounded-2xl border-2 border-primary/35 border-t-transparent animate-spin" />
        </div>
        <p className="text-on-surface-variant text-[11px] uppercase tracking-[0.32em] font-bold">
          Loading WeeklyOS...
        </p>
      </div>
    </div>
  )
}
