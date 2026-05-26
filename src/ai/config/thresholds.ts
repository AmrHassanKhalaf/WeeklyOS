/**
 * Configurable detection thresholds for the AI system.
 *
 * Centralizing these prevents magic numbers from scattering across stage files.
 * Every threshold is documented with its role and numeric domain.
 */
export const THRESHOLDS = {
  // ─── Workload ────────────────────────────────────────────────────────────────

  workload: {
    /** Days with pending count ≥ this value are considered overloaded. */
    overloadPendingCount: 4,
    /** Days with a computed pressure score ≥ this are considered overloaded. */
    overloadPressureScore: 60,
    /** Overall pressure triggering 'medium' risk level. */
    riskMedium: 35,
    /** Triggers 'high' risk level. */
    riskHigh: 60,
    /** Triggers 'critical' risk level. */
    riskCritical: 80,
    /**
     * Max high-priority tasks on a single day before risk escalates to 'critical'.
     * Overrides pressure-based thresholds.
     */
    criticalHighPriorityPerDay: 4,
  },

  // ─── Task completion quality ─────────────────────────────────────────────────

  completion: {
    /** Completion rate ≥ this → quality 'excellent'. */
    excellent: 75,
    /** Completion rate ≥ this → quality 'good'. */
    good: 50,
    /** Completion rate ≥ this → quality 'fair'. */
    fair: 30,
    // Below 'fair' threshold → quality 'poor'
  },

  // ─── Focus session quality ───────────────────────────────────────────────────

  focus: {
    /** Total minutes ≥ this → pattern 'strong'. */
    strongMinutes: 120,
    /** Total minutes ≥ this → pattern 'regular'. */
    regularMinutes: 60,
    /** Total minutes ≥ this → pattern 'occasional'. */
    occasionalMinutes: 20,
  },

  // ─── Habit consistency score (0–100) ────────────────────────────────────────

  habit: {
    /** Consistency score ≥ this → pattern 'strong'. */
    strong: 70,
    /** Consistency score ≥ this → pattern 'moderate'. */
    moderate: 40,
    /** Consistency score ≥ this → pattern 'weak'. */
    weak: 10,
  },

  // ─── Carry-over concern levels (ratio of totalPlanned) ──────────────────────

  carryOver: {
    /** Carry-over ratio ≥ this is 'concerning'. */
    concernRatio: 0.30,
    /** Carry-over ratio ≥ this is 'critical'. */
    criticalRatio: 0.50,
  },

  // ─── Workload sustainability signals ────────────────────────────────────────

  sustainability: {
    /** Overall pressure ≥ this → 'mild' sustainability concern. */
    mildPressure: 45,
    /** Overall pressure ≥ this → 'moderate' concern. */
    moderatePressure: 65,
    /** Overall pressure ≥ this → 'high risk'. */
    highRiskPressure: 80,
  },

  // ─── Planning accuracy ────────────────────────────────────────────────────────

  planningAccuracy: {
    /** Accuracy ≥ this (%) → 'balanced' planning. */
    balanced: 75,
    /** Accuracy < this (%) → 'overplanned'. */
    overplanned: 50,
  },
} as const

export type Thresholds = typeof THRESHOLDS
