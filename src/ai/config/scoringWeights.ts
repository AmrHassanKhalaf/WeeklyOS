/**
 * Centralized scoring weights for the AI system.
 *
 * All values are dimensionless ratios/bonuses. Modify here to adjust how
 * the system weighs signals across planning AND reflection without touching
 * individual stage files.
 */
export const SCORING_WEIGHTS = {
  // ─── Overall weekly score composition ──────────────────────────────────────

  /** Fraction of overall score from task completion. Must sum with others to ≤ 1. */
  completionWeight: 0.60,
  /** Fraction of overall score from focus session quality. */
  focusWeight: 0.25,
  /** Fraction of overall score from habit consistency. */
  habitWeight: 0.15,

  /**
   * Multiplier applied when scoring whether high-priority tasks were completed.
   * E.g. 1.5 = completing a high-priority task counts 50% more than medium.
   */
  highPriorityCompletionMultiplier: 1.5,

  // ─── Planning — task priority scoring ───────────────────────────────────────

  planning: {
    /** Base priority scores. Higher base = higher final score. */
    priorityBase: { high: 60, medium: 35, low: 15 } as Record<string, number>,
    /** Added to score when a task missed its scheduled day (carry-over). */
    carryOverBonus: 25,
    /** Added to score for high-priority tasks (stacked on top of base). */
    highPriorityBonus: 10,
    /** Added to score when a task has no day assigned. */
    unscheduledBonus: 8,
    /** Subtracted when a task is on an overloaded day (signals candidate for move). */
    overloadDayPenalty: -12,
    /** Workload pressure formula: each pending task contributes this to pressure. */
    pressurePendingWeight: 12,
    /** Each high-priority pending task contributes this extra pressure. */
    pressureHighPriorityWeight: 10,
  },

  // ─── Reflection — score contribution by quality level ───────────────────────

  reflection: {
    completion: {
      /** Score contribution for excellent (≥75%) completion. */
      excellent: 1.0,
      /** Good (50–75%). */
      good: 0.7,
      /** Fair (30–50%). */
      fair: 0.45,
      /** Poor (<30%). */
      poor: 0.2,
    },
    focus: {
      /** Strong: ≥120 min total. */
      strong: 1.0,
      /** Regular: 60–120 min. */
      regular: 0.7,
      /** Occasional: 20–60 min. */
      occasional: 0.4,
      /** No sessions logged. */
      none: 0.1,
    },
    habit: {
      /** Strong: ≥70% consistency. */
      strong: 1.0,
      /** Moderate: 40–70%. */
      moderate: 0.6,
      /** Weak: 10–40%. */
      weak: 0.3,
      /** No data or no active habits. */
      missing: 0.0,
    },
  },
} as const

export type ScoringWeights = typeof SCORING_WEIGHTS
