import type { ProgressData } from './index';

export interface StarRules {
  oneStar: { mustComplete: boolean };
  twoStars: { maxCommands: number };
  threeStars: { maxCommands: number };
}

export interface StarResult {
  stars: number;
  details: {
    oneStar: boolean;
    twoStars: boolean;
    threeStars: boolean;
  };
}

export function calculateStars(progress: ProgressData, rules: StarRules): StarResult {
  const details = {
    oneStar: false,
    twoStars: false,
    threeStars: false,
  };

  if (progress.completed && rules.oneStar.mustComplete) {
    details.oneStar = true;
  }

  if (details.oneStar && progress.bestCommandCount <= rules.twoStars.maxCommands) {
    details.twoStars = true;
  }

  if (details.twoStars && progress.bestCommandCount <= rules.threeStars.maxCommands) {
    details.threeStars = true;
  }

  return {
    stars: [details.oneStar, details.twoStars, details.threeStars].filter(Boolean).length,
    details,
  };
}

export function starsToString(stars: number): string {
  return '*'.repeat(stars) + '-'.repeat(3 - stars);
}
