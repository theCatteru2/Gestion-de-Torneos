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
    // Limpiar estadísticas previas
    AppState.teams.forEach(team => team.resetStats());

    // Iterar sobre todos los partidos jugados para reconstruir los puntajes
    AppState.matches.forEach(match => {
        if (match.isPlayed) {
            const teamA = AppState.teams.find(t => t.id === match.teamA.id);
            const teamB = AppState.teams.find(t => t.id === match.teamB.id);

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

function generateRoundRobin(teamsArray) {
    let matches = [];
    let localTeams = [...teamsArray];
    
    // Si es impar, se agrega un equipo ficticio
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
                matches.push(new Match(`R${round}-M${i}`, teamA, teamB, `Fecha ${round + 1}`));
            }
        }
        // Rotación del algoritmo del polígono
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

    AppState.teams = names.map((name, index) => new Team(index, name));
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

    // Generar la estructura de grupos
    for (let i = 0; i < numGroups; i++) {
        AppState.groups[groupLetters[i]] = [];
    }

    // Asignar un equipo de cada bombo a cada grupo
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
    
    for (const [groupName, teams] of Object.entries(AppState.groups)) {
        const groupMatches = generateRoundRobin(teams);
        groupMatches.forEach(match => {
            match.stage = `Grupo ${groupName} - ${match.stage}`;
            AppState.matches.push(match);
        });
    }
}