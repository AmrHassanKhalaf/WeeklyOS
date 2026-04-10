import { useWeekStore, DayOfWeek } from '../store/useWeekStore'

export function WeeklyChallengeCircles() {
  const { currentWeek, toggleChallengeDayStatus } = useWeekStore()

  if (!currentWeek?.challengeDays || currentWeek.challengeDays.length === 0) {
    return null
  }

  const challengeDays = currentWeek.challengeDays
  const today = new Date()
  const todayDayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()] as DayOfWeek

  // Calculate if a day is in the past, today, or future
  const dayOrder: DayOfWeek[] = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  const todayIndex = dayOrder.indexOf(todayDayOfWeek)

  const getDayIndex = (dayOfWeek: DayOfWeek) => dayOrder.indexOf(dayOfWeek)
  const isFutureDay = (dayOfWeek: DayOfWeek) => {
    const dayIndex = getDayIndex(dayOfWeek)
    return dayIndex > todayIndex
  }
  const isToday = (dayOfWeek: DayOfWeek) => dayOfWeek === todayDayOfWeek

  // Count success days for progress
  const successCount = challengeDays.filter(cd => cd.status === 'success').length
  const progress = (successCount / 7) * 100

  // Streak counter
  let streak = 0
  for (const day of challengeDays) {
    if (day.status === 'success') {
      streak++
    } else {
      break
    }
  }

  const handleCircleClick = async (dayOfWeek: DayOfWeek) => {
    if (isFutureDay(dayOfWeek)) return // Disabled for future days
    await toggleChallengeDayStatus(dayOfWeek)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-on-surface">7-Day Challenge</h3>
      </div>

      {/* Circle Grid */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {challengeDays.map((day) => {
          const future = isFutureDay(day.dayOfWeek)
          const current = isToday(day.dayOfWeek)
          const statusIcon =
            day.status === 'success' ? '✔' :
            day.status === 'fail' ? '✖' :
            day.dayOfWeek.slice(0, 1).toUpperCase()

          return (
            <button
              key={day.dayOfWeek}
              onClick={() => handleCircleClick(day.dayOfWeek)}
              disabled={future}
              className={`
                w-16 h-16 rounded-full flex flex-col items-center justify-center font-bold
                transition-all duration-200 shrink-0
                ${future ? 'opacity-30 cursor-not-allowed bg-surface-container' : 'cursor-pointer hover:scale-105 active:scale-95'}
                ${
                  day.status === 'success'
                    ? 'bg-gradient-to-br from-tertiary to-green-600 text-background shadow-lg shadow-tertiary/30'
                    : day.status === 'fail'
                    ? 'bg-gradient-to-br from-error to-red-700 text-background shadow-lg shadow-error/30'
                    : current
                    ? 'bg-surface-container-highest border-2 border-primary shadow-lg shadow-primary/40'
                    : 'bg-surface-container-highest border border-white/10'
                }
              `}
              title={future ? 'Future day (locked)' : `${day.dayOfWeek} - ${day.date}`}
            >
              <span className="text-xl">{statusIcon}</span>
              <span className="text-[10px] mt-0.5 opacity-80">{day.dayOfWeek.slice(0, 3).toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-end text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-tertiary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-low rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-tertiary">{successCount}</div>
          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">OK</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{streak}</div>
          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Run</div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-error">
            {challengeDays.filter(cd => cd.status === 'fail').length}
          </div>
          <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">X</div>
        </div>
      </div>
    </div>
  )
}
