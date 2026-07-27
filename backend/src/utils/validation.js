function validateOdds(odds) {
    if (!Array.isArray(odds) || odds.length < 2) {
        throw new Error("Invalid odds array, must contain an array of least two odds")
    }
    for (const odd of odds){
        if (Number.isFinite(odd) || odd <= 1 || odd >= 100 || typeof odd !== "number") { 
            throw new Error("Expecting valid, non-american odds")
        }
    }
  }


function validateBankroll(bankroll) {
    if (typeof bankroll !== "number" || bankroll <= 0){
        throw new Error("Bankroll must be a positive number")
    }
}

module.exports = {
    validateOdds,
    validateBankroll
}
