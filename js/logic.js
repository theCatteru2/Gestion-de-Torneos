function sortStandings(teamsArray) {
    return teamsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
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

    if (AppState.mode === 'tournament') {
        updateKnockoutBracket();
    }
}

function generateRoundRobin(teamsArray, groupPrefix = "") {
    let matches = [];
    
    if (teamsArray.length === 4) {
        const fixtureMap = [
            [ [0, 1], [2, 3] ],
            [ [0, 2], [3, 1] ],
            [ [3, 0], [1, 2] ]
        ];

        fixtureMap.forEach((round, rIndex) => {
            round.forEach((pair, pIndex) => {
                let teamA = teamsArray[pair[0]];
                let teamB = teamsArray[pair[1]];
                const uniqueId = groupPrefix ? `${groupPrefix}-R${rIndex}-M${pIndex}` : `R${rIndex}-M${pIndex}`;
                const roundNum = rIndex + 1;
                
                let match = new Match(uniqueId, teamA, teamB, `Fecha ${roundNum}`);
                match.roundNumber = roundNum;
                match.groupName = groupPrefix;
                matches.push(match);
            });
        });
        return matches;
    }

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
                
                let match = new Match(uniqueId, teamA, teamB, `Fecha ${roundNum}`);
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

function getTournamentStructureInfo() {
    let numGroups = Object.keys(AppState.groups).length;
    let totalTeams = 0;
    for (const group in AppState.groups) {
        totalTeams += AppState.groups[group].length;
    }
    
    if (numGroups === 0) return { K: 0, bestThirdsNeeded: 0, dir: 0 };

    let K = Math.pow(2, Math.floor(Math.log2(totalTeams)));
    if (K >= totalTeams && K > 2) K /= 2;

    let dir = Math.floor(K / numGroups);
    let bestThirdsNeeded = K % numGroups;

    return { K, bestThirdsNeeded, dir };
}

function getFixedBracketSlots() {
    const { K, bestThirdsNeeded, dir } = getTournamentStructureInfo();
    if (K === 0) return [];

    let groupLetters = Object.keys(AppState.groups).sort();
    let slots = [];

    for (let i = 0; i < dir; i++) {
        groupLetters.forEach(g => {
            slots.push({ rank: i + 1, group: g, label: `${i + 1}º ${g}`, isGlobal: false });
        });
    }

    for (let i = 0; i < bestThirdsNeeded; i++) {
        slots.push({ rank: dir + 1, group: '?', label: `Mejor ${dir + 1}º #${i + 1}`, isGlobal: true, globalIndex: i });
    }

    slots = slots.slice(0, K);

    let p1 = slots.slice(0, K / 2);
    let p2 = slots.slice(K / 2);
    let matchups = [];

    for (let i = 0; i < p1.length; i++) {
        let slotA = p1[i];
        let indexB = p2.findIndex(s => s.group !== slotA.group || s.group === '?');
        if (indexB === -1) indexB = 0;
        let slotB = p2.splice(indexB, 1)[0];
        
        if (i % 2 === 0) matchups.push({ slotA, slotB });
        else matchups.unshift({ slotA, slotB });
    }
    return matchups;
}

function initializeKnockoutBracket() {
    const { K } = getTournamentStructureInfo();
    if (K === 0) return;

    let rounds = [];
    let matchCount = K / 2;
    let roundIndex = 0;
    let initialSlots = getFixedBracketSlots();

    while (matchCount >= 1) {
        let roundName = "";
        if (matchCount === 1) roundName = "Final";
        else if (matchCount === 2) roundName = "Semifinales";
        else if (matchCount === 4) roundName = "Cuartos de Final";
        else if (matchCount === 8) roundName = "Octavos de Final";
        else if (matchCount === 16) roundName = "Dieciseisavos de Final";
        else roundName = "Ronda Preliminar";
        
        let matchesObj = [];
        for (let i = 0; i < matchCount; i++) {
            let matchDef = {
                id: `K-${roundIndex}-${i}`,
                teamA: null,
                teamB: null,
                scoreA: "",
                scoreB: "",
                winnerId: null,
                nextMatchId: matchCount > 1 ? `K-${roundIndex + 1}-${Math.floor(i / 2)}` : null,
                positionInNext: i % 2 === 0 ? 'teamA' : 'teamB'
            };

            if (roundIndex === 0 && initialSlots[i]) {
                matchDef.slotA = initialSlots[i].slotA;
                matchDef.slotB = initialSlots[i].slotB;
            }

            matchesObj.push(matchDef);
        }
        rounds.push({ name: roundName, matches: matchesObj });
        
        matchCount = matchCount / 2;
        roundIndex++;
    }

    AppState.bracket = { rounds: rounds };
    updateKnockoutBracket();
}

function updateKnockoutBracket() {
    if (!AppState.bracket || !AppState.bracket.rounds || AppState.bracket.rounds.length === 0) return;

    const { dir, bestThirdsNeeded } = getTournamentStructureInfo();
    let allMatchesPlayed = AppState.matches.filter(m => m.stage.includes("Grupo") && !m.isPlayed).length === 0;

    let lockedTeamsByGroup = {};
    for (const [groupName, groupTeams] of Object.entries(AppState.groups)) {
        let standings = sortStandings([...groupTeams]);
        
        // Cálculo de puntos máximos posibles por equipo
        standings.forEach(t => {
            let unplayed = AppState.matches.filter(m => !m.isPlayed && m.stage.includes("Grupo") && (m.teamA.id === t.id || m.teamB.id === t.id)).length;
            t.maxPts = t.points + (unplayed * 3);
        });

        let allGroupPlayed = AppState.matches.filter(m => m.groupName === groupName && !m.isPlayed).length === 0;
        let locked = {};

        // Bloqueo de instancias matemáticas
        if (allGroupPlayed) {
            standings.forEach((t, i) => locked[i + 1] = t);
        } else {
            if (standings.length > 1 && standings[0].points > standings[1].maxPts) {
                locked[1] = standings[0];
                if (standings.length > 2 && standings[1].points > standings[2].maxPts) {
                    locked[2] = standings[1];
                    if (standings.length > 3 && standings[2].points > standings[3].maxPts) {
                        locked[3] = standings[2];
                    }
                }
            }
        }
        lockedTeamsByGroup[groupName] = locked;
    }

    // Resolución de cupos condicionados (Mejores Terceros) al finalizar la totalidad de grupos
    let globalThirds = [];
    if (allMatchesPlayed && bestThirdsNeeded > 0) {
        let thirds = [];
        for (const groupName in AppState.groups) {
            let st = sortStandings([...AppState.groups[groupName]]);
            if (st[dir]) thirds.push(st[dir]);
        }
        globalThirds = sortStandings(thirds);
    }

    let round0 = AppState.bracket.rounds[0];
    round0.matches.forEach(m => {
        if (m.slotA) {
            if (!m.slotA.isGlobal) {
                m.teamA = lockedTeamsByGroup[m.slotA.group][m.slotA.rank] || null;
            } else {
                m.teamA = allMatchesPlayed ? (globalThirds[m.slotA.globalIndex] || null) : null;
            }
        }
        if (m.slotB) {
            if (!m.slotB.isGlobal) {
                m.teamB = lockedTeamsByGroup[m.slotB.group][m.slotB.rank] || null;
            } else {
                m.teamB = allMatchesPlayed ? (globalThirds[m.slotB.globalIndex] || null) : null;
            }
        }
    });
}
