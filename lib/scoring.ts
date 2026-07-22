export type Score = {
  homeScore: number | null;
  awayScore: number | null;
};

export type PredictionScore = {
  homeGoals: number;
  awayGoals: number;
};

const sign = (value: number) => (value === 0 ? 0 : value > 0 ? 1 : -1);

export function pointsForPrediction(match: Score, prediction: PredictionScore) {
  if (match.homeScore === null || match.awayScore === null) return 0;

  const actualDiff = match.homeScore - match.awayScore;
  const predictedDiff = prediction.homeGoals - prediction.awayGoals;

  if (match.homeScore === prediction.homeGoals && match.awayScore === prediction.awayGoals) {
    return 4;
  }

  if (sign(actualDiff) === sign(predictedDiff) && actualDiff === predictedDiff) {
    return 3;
  }

  if (sign(actualDiff) === sign(predictedDiff)) {
    return 2;
  }

  return 0;
}
