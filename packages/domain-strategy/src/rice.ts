export interface RiceInput {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

export function calculateRiceScore(input: RiceInput): number {
  if (input.effort <= 0) {
    return 0;
  }
  return (input.reach * input.impact * (input.confidence / 100)) / input.effort;
}
