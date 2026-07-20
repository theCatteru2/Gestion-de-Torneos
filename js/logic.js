function sortStandings(teamsArray) {
    return teamsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        return 0; 
    });
}

function processMatchResult(matchId, scoreA, scoreB) {
    const match = AppState.matches.find(m => m.id === matchId);
    if (!match) return;

    match.scoreA = parseInt(scoreA, 10);
    match.scoreB = parseInt(scoreB, 10);
    match.isPlayed = true;

    recalculateStandings();
}

function recalculateStandings() {
    // 1. Reseteo imperativo y estricto para evitar duplicaciones de memoria
    AppState.teams.forEach(team => {
        team.points = 0;
        team.matchesPlayed = 0;
        team.matchesWon = 0;
        team.matchesDrawn = 0;
        team.matchesLost = 0;
        team.goalsFor = 0;
        team.goalsAgainst = 0;
        team.goalDifference = 0;
    });

    // 2. Sumatoria exclusiva de partidos de fase regular/grupos finalizados
    AppState.matches.forEach(match => {
        if (match.isPlayed && match.stage.includes("Grupo")) {
            const teamA = AppState.teams.find(t => String(t.id) === String(match.teamA.id));
            const teamB = AppState.teams.find(t => String(t.id) === String(match.teamB.id));

            if (!teamA || !teamB) return;

            teamA.matchesPlayed++;
            teamB.matchesPlayed++;
            teamA.goalsFor += match.scoreA;
            teamA.goalsAgainst += match.scoreB;
            teamB.goalsFor += match.scoreB;
            teamB.goalsAgainst += match.scoreA;

            if (match.scoreA > match.scoreB) {
                teamA.matchesWon++;
                teamA.points += 3;
                teamB.matchesLost++;
            } else if (match.scoreA < match.scoreB) {
                teamB.matchesWon++;
                teamB.points += 3;
                teamA.matchesLost++;
            } else {
                teamA.matchesDrawn++;
                teamA.points += 1;
                teamB.matchesDrawn++;
                teamB.points += 1;
            }

            teamA.goalDifference = teamA.goalsFor - teamA.goalsAgainst;
            teamB.goalDifference = teamB.goalsFor - teamB.goalsAgainst;
        }
    });
}

function generateRoundRobin(teamsArray, groupPrefix = "") {
    let matches = [];
    let localTeams = [...teamsArray];
    
    if (localTeams.length % 2 !== 0) {
        localTeams.push(new Team('BYE', 'Libre'));
    }

    const numRounds = localTeams.length - 1;
    const halfSize = localTeams.length / 2;

    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
            let teamA = localTeams[i];
            let teamB = localTeams[localTeams.length - 1 - i];

            if (teamA.id !== 'BYE' && teamB.id !== 'BYE') {
                const uniqueId = groupPrefix ? `${groupPrefix}-R${round}-M${i}` : `R${round}-M${i}`;
                const roundNum = round + 1;
                const stageLabel = `Fecha ${roundNum}`;
                
                let match = new Match(uniqueId, teamA, teamB, stageLabel);
                match.roundNumber = roundNum;
                match.groupName = groupPrefix;
                matches.push(match);
            }
        }
        localTeams.splice(1, 0, localTeams.pop());
    }
    return matches;
}

function initializeLeague(teamNamesText) {
    const names = teamNamesText.split('\n').map(n => n.trim()).filter(n => n !== "");
    
    if (names.length < 2) {
        alert("Debes ingresar al menos 2 equipos.");
        return false;
    }

    AppState.teams = names.map((name, index) => new Team(index + 1, name));
    AppState.matches = generateRoundRobin(AppState.teams);
    AppState.mode = 'league';

    return true;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function executeDraw(potsData) {
    AppState.groups = {};
    const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numGroups = potsData[0].length;

    for (let i = 0; i < numGroups; i++) {
        AppState.groups[groupLetters[i]] = [];
    }

    potsData.forEach((pot) => {
        let shuffledPot = shuffleArray([...pot]);
        for (let i = 0; i < numGroups; i++) {
            let team = shuffledPot[i];
            AppState.groups[groupLetters[i]].push(team);
        }
    });
}

function generateGroupStageMatches() {
    AppState.matches = [];
    let tempMatches = [];

    for (const [groupName, teams] of Object.entries(AppState.groups)) {
        const groupMatches = generateRoundRobin(teams, groupName);
        tempMatches.push(...groupMatches);
    }

    tempMatches.sort((a, b) => {
        if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
        return a.groupName.localeCompare(b.groupName);
    });

    AppState.matches = tempMatches.map(m => {
        m.stage = `Fecha ${m.roundNumber} - Grupo ${m.groupName}`;
        return m;
    });
}

function generateKnockoutBracket() {
    let numGroups = Object.keys(AppState.groups).length;
    if (numGroups === 0) return;

    // Calcular tamaño de la llave (K)
    let K = 2;
    if (numGroups >= 2 && numGroups < 3) K = 4;
    else if (numGroups >= 3 && numGroups < 5) K = 8;
    else if (numGroups >= 5 && numGroups < 9) K = 16;
    else if (numGroups >= 9 && numGroups <= 16) K = 32;

    let firsts = [];
    let seconds = [];
    let thirds = [];

    // Extraer posiciones
    for (const [groupName, groupTeams] of Object.entries(AppState.groups)) {
        const sorted = sortStandings([...groupTeams]);
        if (sorted[0]) firsts.push(sorted[0]);
        if (sorted[1]) seconds.push(sorted[1]);
        if (sorted[2]) thirds.push(sorted[2]);
    }

    firsts = sortStandings(firsts);
    seconds = sortStandings(seconds);
    thirds = sortStandings(thirds);

    let qualified = [];
    qualified.push(...firsts);
    qualified.push(...seconds);
    
    // Completar con mejores terceros si el número de grupos no cubre K
    if (qualified.length < K) {
        qualified.push(...thirds.slice(0, K - qualified.length));
    } else if (qualified.length > K) {
        qualified = qualified.slice(0, K);
    }

    // Armado de cruces: el mejor clasificado vs el peor clasificado
    let initialMatchups = [];
    let totalMatches = K / 2;
    for (let i = 0; i < totalMatches; i++) {
        initialMatchups.push({
            teamA: qualified[i],
            teamB: qualified[K - 1 - i]
        });
    }

    let rounds = [];
    let currentMatches = initialMatchups;
    let roundIndex = 0;

    // Construcción del árbol y nodos de avance
    while (currentMatches.length > 0) {
        let roundName = "";
        if (currentMatches.length === 1) roundName = "Final";
        else if (currentMatches.length === 2) roundName = "Semifinales";
        else if (currentMatches.length === 4) roundName = "Cuartos de Final";
        else if (currentMatches.length === 8) roundName = "Octavos de Final";
        else if (currentMatches.length === 16) roundName = "Dieciseisavos de Final";
        
        let matchesObj = [];
        for (let i = 0; i < currentMatches.length; i++) {
            matchesObj.push({
                id: `K-${roundIndex}-${i}`,
                teamA: currentMatches[i].teamA || null,
                teamB: currentMatches[i].teamB || null,
                result: "",
                winnerId: null,
                nextMatchId: currentMatches.length > 1 ? `K-${roundIndex + 1}-${Math.floor(i / 2)}` : null,
                positionInNext: i % 2 === 0 ? 'teamA' : 'teamB'
            });
        }
        rounds.push({ name: roundName, matches: matchesObj });
        
        if (currentMatches.length === 1) break;

        let nextMatches = [];
        for (let i = 0; i < currentMatches.length / 2; i++) {
            nextMatches.push({ teamA: null, teamB: null });
        }
        currentMatches = nextMatches;
        roundIndex++;
    }

    AppState.bracket = { rounds: rounds };
}
