const {
    calculateStake,
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

// Only works for 2 way right now
function roundArbitrageStakes(stakes, odds){
  try {if (Array.isArray(stakes) && stakes.length === 2 && Array.isArray(odds) && odds.length === 2){
    const totalStake = stakes[0] + stakes[1];
    const minimumStake1 = totalStake/odds[0];
    const maximumStake1 = totalStake * (1 - (1/odds[1]));
    const maximumStake2 = totalStake - minimumStake1;
    const minimumStake2 = totalStake - maximumStake1;

    if (stakes[0] <= minimumStake1 || stakes[0] >= maximumStake1){
      throw new Error("Stakes cannot be further rounded without losing the arbitrage opportunity. Please adjust the bankroll or odds.");
    } else {
      const increment = 0.50 // Round to the nearest 50p

      const roundedStake1Lower = Math.floor(stakes[0] / increment) * increment;
      const roundedStake2Lower = totalStake - roundedStake1Lower;
      if (roundedStake1Lower < minimumStake1 || roundedStake2Lower > maximumStake2){
        throw new Error("Stakes cannot be further rounded without losing the arbitrage opportunity. Please adjust the bankroll or odds.");
      }
      const roundedStake1Upper = Math.ceil(stakes[0] / increment) * increment;
      const roundedStake2Upper = totalStake - roundedStake1Upper;
      if (roundedStake1Upper > maximumStake1 || roundedStake2Upper < minimumStake2){
        throw new Error("Stakes cannot be further rounded without losing the arbitrage opportunity. Please adjust the bankroll or odds.");
      }
      const profitLower = Math.min(roundedStake1Lower * odds[0], roundedStake2Lower * odds[1])- totalStake;
      const profitUpper = Math.min(roundedStake1Upper * odds[0], roundedStake2Upper * odds[1])- totalStake;

      if (profitUpper > profitLower){
        return [roundedStake1Upper, roundedStake2Upper];
      } else {
        return [roundedStake1Lower, roundedStake2Lower];
      };
    };
  };
  } catch (error) {
    console.error("Error in roundArbitrageStakes:", error);
    throw error;
  };
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
  console.log({
    marketType: transformedOdds[0].marketType,
    bestOdds,
    odds
  });
  const isArbitrage = calculateIsArbitrage(odds)
  const rawStakes = calculateStake(bankroll, odds);
  let stakes = rawStakes;

  if (odds.length === 2) {
    try {
      stakes = roundArbitrageStakes(rawStakes, odds);
    } catch (error) {
      console.error("Unable to round arbitrage stakes, falling back to raw stakes:", error.message);
    }
  }

  const guaranteedProfit = stakes.reduce((profit, stake, index) => {
    return Math.min(profit, stake * odds[index]);
  }, Infinity) - bankroll;
  if (isArbitrage && guaranteedProfit/bankroll >= 0.02){
    return {
      eventID: transformedOdds[0].eventID,
      homeTeam: transformedOdds[0].homeTeam,
      awayTeam: transformedOdds[0].awayTeam,
      startTime: transformedOdds[0].startTime,
      marketType: transformedOdds[0].marketType,
      isArbitrage: true,
      bestOdds: bestOdds,
      
      stakes,
      guaranteedProfit: guaranteedProfit,
    };
  } else if (isArbitrage && guaranteedProfit/bankroll < 0.02){
    return {
      isArbitrage: true,
      alert: "Arbitrage detected but profit not enough, less than 2%",
      eventID: transformedOdds[0].eventID,
      homeTeam: transformedOdds[0].homeTeam,
      awayTeam: transformedOdds[0].awayTeam,
      guaranteedProfit: 0
    };
  } else {
    return false;
  };
  };

module.exports = {
  calculateArbitrage,
  calculateIsArbitrage,
  findArbitrageOpportunities
};