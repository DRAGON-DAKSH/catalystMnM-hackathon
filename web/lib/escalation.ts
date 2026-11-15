const STEPS = {
  normal: [0, 20, 45],
  critical: [0, 10, 25, 45],
};

/** Highest escalation level reached, given minutes past the scheduled time. 0 = not due yet. */
export function targetLevel(minutesLate: number, critical: boolean): number {
  if (minutesLate < 0) return 0;
  const steps = critical ? STEPS.critical : STEPS.normal;
  let level = 0;
  steps.forEach((m, i) => {
    if (minutesLate >= m) level = i + 1;
  });
  return level;
}