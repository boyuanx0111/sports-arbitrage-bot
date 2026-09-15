const {
  calculateStake,
} = require('../utils/arbitrageMath');

function calculateArbitrage(odds, bankroll) {
  if (!Array.isArray(odds) || odds.length < 2) {
    throw new Error("Invalid odds array, must contain at least two odds")
  }
  if (typeof bankroll !== "number" || bankroll <= 0) {
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
function roundArbitrageStakes(stakes, odds) {
  try {
    if (!Array.isArray(stakes) || stakes.length !== 2 || !Array.isArray(odds) || odds.length !== 2) {
      return stakes;
    }

    const totalStake = stakes.reduce((sum, stake) => sum + stake, 0);
    const increment = 0.50; // Round to the nearest 50p
    const minimumStakes = odds.map((odd) => totalStake / odd);
    const maximumStakes = minimumStakes.map((minimumStake, index) =>
      totalStake - minimumStakes.reduce((sum, stake, j) => (index !== j ? sum + stake : sum), 0)
    );
    const lowerStakes = stakes.map((stake) => Math.floor(stake / increment) * increment);
    const upperStakes = stakes.map((stake) => Math.ceil(stake / increment) * increment);

    function calculateGuaranteedProfit(testStakes) {
      const returns = testStakes.map((stake, i) => stake * odds[i]);
      return Math.min(...returns) - totalStake;
    }

    for (let i = 0; i < stakes.length; i++) {
      if (stakes[i] < minimumStakes[i] || stakes[i] > maximumStakes[i]) {
        throw new Error(
          "Stakes cannot be further rounded without losing the arbitrage opportunity. Please adjust the bankroll or odds."
        );
      }
    }

    let bestStakes = null;
    let bestProfit = -Infinity;

    function search(index, currentStakes) {
      if (index === stakes.length) {
        const currentTotal = currentStakes.reduce((sum, stake) => sum + stake, 0);

        if (Math.abs(currentTotal - totalStake) > 0.000001) {
          return;
        }

        for (let i = 0; i < currentStakes.length; i++) {
          if (
            currentStakes[i] <= minimumStakes[i] ||
            currentStakes[i] >= maximumStakes[i]
          ) {
            return;
          }
        }

        const guaranteedProfit = calculateGuaranteedProfit(currentStakes);

        if (guaranteedProfit <= 0) {
          return;
        }

        if (guaranteedProfit > bestProfit) {
          bestProfit = guaranteedProfit;
          bestStakes = [...currentStakes];
        }

        return;
      }

      search(index + 1, [...currentStakes, lowerStakes[index]]);
      search(index + 1, [...currentStakes, upperStakes[index]]);
    }

    search(0, []);

    if (!bestStakes) {
      throw new Error(
        "Stakes cannot be rounded without losing the arbitrage opportunity. Please adjust the bankroll or odds."
      );
    }

    return bestStakes;
  } catch (error) {
    console.error("Error in roundArbitrageStakes:", error);
    throw error;
  }
}


function findArbitrageOpportunities(transformedOdds, bankroll) {
  // transformedOdds is an array of standard odds objects, each representing a bookmaker's odds for a specific event.
  // Maybe create a new function to group events by ID and bet type
  // grouping moved into helpers to group two apis before arb
  const marketOdds = transformedOdds;

  const bestOdds = {};

  for (const standardOdds of marketOdds) {
    for (const outcome of standardOdds.outcomes) {

      if (!bestOdds[outcome.outcome]) {
        bestOdds[outcome.outcome] = {
          odds: outcome.odds,
          bookmaker: standardOdds.bookmaker
        };
      } else if (bestOdds[outcome.outcome].odds < outcome.odds) {
        bestOdds[outcome.outcome] = {
          odds: outcome.odds,
          bookmaker: standardOdds.bookmaker
        };
      }
    }
  }

  const odds = Object.values(bestOdds).map((odd) => odd.odds);

  if (odds.length < 2) {
    return false;
  }

  //debug 
  // console.log({
  //   marketType: marketOdds[0].marketType,
  //   line: marketOdds[0].line,
  //   bestOdds,
  //   odds
  // });
  const isArbitrage = calculateIsArbitrage(odds)

  if (!isArbitrage) {
    return false;
  }

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
  if (isArbitrage && guaranteedProfit / bankroll >= 0.02) {
    const legs = Object.entries(bestOdds).map(([outcome, odd], index) => ({
      outcome,
      bookmaker: odd.bookmaker,
      odds: odd.odds,
      stake: stakes[index]
    }));

    return {
      eventID: marketOdds[0].eventID,
      homeTeam: marketOdds[0].homeTeam,
      awayTeam: marketOdds[0].awayTeam,
      startTime: marketOdds[0].startTime,
      marketType: marketOdds[0].marketType,
      line: marketOdds[0].line,
      isArbitrage: true,
      bestOdds: bestOdds,
      legs,

      stakes,
      guaranteedProfit: guaranteedProfit,
    };
  } else if (isArbitrage && guaranteedProfit / bankroll < 0.02) {
    return {
      isArbitrage: true,
      alert: "Arbitrage detected but profit not enough, less than 2%",
      eventID: marketOdds[0].eventID,
      homeTeam: marketOdds[0].homeTeam,
      awayTeam: marketOdds[0].awayTeam,
      guaranteedProfit: 0
    };
  } else {
    return false;
  } // closes for marketodds
  return false;
} // closes findarbopportunities

module.exports = {
  calculateArbitrage,
  calculateIsArbitrage,
  findArbitrageOpportunities
};