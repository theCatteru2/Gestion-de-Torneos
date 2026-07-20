class Team {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.resetStats();
    }

    resetStats() {
        this.points = 0;
        this.matchesPlayed = 0;
        this.matchesWon = 0;
        this.matchesDrawn = 0;
        this.matchesLost = 0;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
        this.goalDifference = 0;
    }
}

class Match {
    constructor(id, teamA, teamB, stage) {
        this.id = id;
        this.teamA = teamA; 
        this.teamB = teamB;
        this.scoreA = null;
        this.scoreB = null;
        this.isPlayed = false;
        this.stage = stage; 
        this.customResultText = ""; 
        this.roundNumber = 0;
        this.groupName = "";
    }
}

const AppState = {
    mode: null, 
    teams: [],
    matches: [],
    groups: {}, 
    bracket: {} 
};
