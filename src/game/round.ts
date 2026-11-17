export type RoundEnd = 'play' | 'win' | 'lose'

/** Pass meter: savings already in the wallet, plus gold dug this stage. */
export function stageProgress(savings: number, earned: number): number {
  return Math.max(0, savings) + Math.max(0, earned)
}

/** Gold still to dig before savings plus this stage reach the running goal. */
export function stillToEarn(savings: number, goal: number): number {
  return Math.max(0, goal - stageProgress(savings, 0))
}

export type RoundState = {
  score: number
  target: number
  timeLeft: number
  intro: number
  itemsLeft: number
}

/**
 * A reached target only ends the round when the clock is done or the field is empty.
 * Until then the player keeps swinging, and a miss on time still fails.
 */
export function resolveRound(state: RoundState): RoundEnd {
  const cleared = state.score >= state.target
  const timeUp = state.timeLeft <= 0 && state.intro <= 0
  if (timeUp) return cleared ? 'win' : 'lose'
  if (cleared && state.itemsLeft <= 0) return 'win'
  return 'play'
}
