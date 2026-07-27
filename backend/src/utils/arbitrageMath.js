const {
    validateOdds,
    validateBankroll
} = require('./validation');

function calculateStake(bankroll, odds) {
    validateBankroll(bankroll);
    validateOdds(odds);
    const impliedProbabilities = odds.map((odd) => 1/odd);
    const totalImpliedProbability = impliedProbabilities.reduce((sum, p) => sum + p, 0);

    const stakes = odds.map((odd) => 
        (bankroll * (1 / odd)) / totalImpliedProbability
    );
    return stakes;
}

function calculateGuaranteedProfit(bankroll, odds) {
    validateBankroll(bankroll);
    validateOdds(odds);
    const impliedProbabilities = odds.map((odd) => 1/odd);
    const totalImpliedProbability = impliedProbabilities.reduce((sum, p) => sum + p, 0);

    const stakes = odds.map((odd) => 
        (bankroll * (1 / odd)) / totalImpliedProbability
    );
    const payouts = stakes.map((stake, i) => stake * odds[i]);
    const guaranteedPayout = Math.min(...payouts);
    const profit = guaranteedPayout - bankroll;
    return profit;
}

function formatPercentage(value) {
    // Just in case we want to display for some reason.
    return `${(value * 100).toFixed(2)}%`;
}

module.exports = {
    calculateStake,
    calculateGuaranteedProfit,
    formatPercentage
}