export type RoundEnd = 'play' | 'win' | 'lose'

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
