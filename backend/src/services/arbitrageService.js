function calculateArbitrage(odds, bankroll) {
  if (!Array.isArray(odds) || odds.length < 2) {
    throw new Error("Invalid odds array, must contain at least two odds")
  }
  if (typeof bankroll !== "number" || bankroll <= 0){
    throw new Error("Bankroll must be a positive number")
  }
  for (const odd of odds){
    if (Number.isFinite(odd) || odd <= 1 || odd >= 100 || typeof odd !== "number") { 
      throw new Error("Expecting valid, non-american odds")
    }
  }
  // Brian if you reading this make sure the odds that come in here are decimal format, and at least two
  // Realisitcally its always 2 but sometimes 3 for home/away/draw.

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
  for (const odd of odds){
    if (Number.isFinite(odd) || odd <= 1 || odd >= 100 || typeof odd !== "number") { 
      throw new Error("Expecting valid, non-american odds")
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

module.exports = {
  calculateArbitrage,
  calculateIsArbitrage
};