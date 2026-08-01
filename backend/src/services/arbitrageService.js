const {
    calculateStake,
    calculateGuaranteedProfit
} = require('../utils/arbitrageMath');

function calculateArbitrage(odds, bankroll) {
  if (!Array.isArray(odds) || odds.length < 2) {
    throw new Error("Invalid odds array, must contain at least two odds")
  }
  if (typeof bankroll !== "number" || bankroll <= 0){
    throw new Error("Bankroll must be a positive number")
  }
  for (const odd of odds) {
    if (typeof odd !== "number" || !Number.isFinite(odd) || odd <= 1 || odd >= 100) {
      console.error("Invalid odd detected in calculateArbitrage:", { odd, odds });
      throw new Error("Expecting valid, non-american odds");
    }
  }
  // Brian if you reading this make sure the odds that come in here are decimal format, and at least two
  // Realistically its always 2 but sometimes 3 for home/away/draw.

  const impliedProbabilities = odds.map((odd) => 1 / odd);
  const totalImpliedProbability = impliedProbabilities.reduce((sum, p) => sum + p, 0);

  const isArbitrage = totalImpliedProbability < 1;
  // No need for this line if we choose to only calculate stakes and everything if its an arbitrage opportunity.

  const stakes = odds.map((odd) => {
    return (bankroll * (1 / odd)) / totalImpliedProbability;
  });

  const payouts = stakes.map((stake, i) => stake * odds[i]);
  const guaranteedPayout = Math.min(...payouts);
  const profit = guaranteedPayout - bankroll;
  const roi = (profit / bankroll) * 100;

  return {
    isArbitrage,
    impliedProbabilities,
    totalImpliedProbability,
    stakes,
    guaranteedPayout,
    profit,
    roi,
  };
}

function calculateIsArbitrage(odds) {
    if (!Array.isArray(odds) || odds.length < 2) {
    throw new Error("Invalid odds array, must contain at least two odds")
  }
  for (const odd of odds) {
    if (typeof odd !== "number" || !Number.isFinite(odd) || odd <= 1 || odd >= 100) {
      console.error("Invalid odd detected in calculateIsArbitrage:", { odd, odds });
      throw new Error("Expecting valid, non-american odds");
    }
  }

  const impliedProbabilities = odds.map((odd) => 1 / odd);
  const totalImpliedProbability = impliedProbabilities.reduce((sum, p) => sum + p, 0);

  const isArbitrage = totalImpliedProbability < 1;

  // just checks if the bet is an arbitrage opportunity - chat said to calculate stakes and everything 
  // in the same function but I think it makes more sense to check if arbitrage first.
  // Maybe separate into different functions.
  // However as of right now all functions are present here.
  return isArbitrage;
}

function findArbitrageOpportunities(transformedOdds, bankroll) {
  // transformedOdds is an array of standard odds objects, each representing a bookmaker's odds for a specific event.
  // Maybe create a new function to group events by ID and bet type
  const bestOdds = {};
  for (const standardOdds of transformedOdds){
    for (const outcome of standardOdds.outcomes) {
      if (!bestOdds[outcome.outcome]){
        bestOdds[outcome.outcome] = {odds: outcome.odds, bookmaker: standardOdds.bookmaker};
      } else{
        if (bestOdds[outcome.outcome].odds < outcome.odds){
          bestOdds[outcome.outcome] = {odds: outcome.odds, bookmaker: standardOdds.bookmaker};
        };
      };
    };
  };
  const odds = Object.values(bestOdds).map((odd) => odd.odds);
  const isArbitrage = calculateIsArbitrage(odds)
  if (isArbitrage){
    return {
      eventID: transformedOdds[0].eventID,
      homeTeam: transformedOdds[0].homeTeam,
      awayTeam: transformedOdds[0].awayTeam,
      startTime: transformedOdds[0].startTime,
      marketType: transformedOdds[0].marketType,
      isArbitrage: true,
      bestOdds: bestOdds,
      
      stakes: calculateStake(bankroll, odds),
      guaranteedProfit: calculateGuaranteedProfit(bankroll, odds),
    };
  } else {
    return false
  };
};

module.exports = {
  calculateArbitrage,
  calculateIsArbitrage,
  findArbitrageOpportunities
};