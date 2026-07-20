function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const targetId = button.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Renderizado de actualización automática al entrar a la pestaña de Eliminatorias
            if (targetId === 'knockout') {
                renderKnockout();
            }
        });
    });
}

function setupModeToggle() {
    const modeSelect = document.getElementById('mode-select');
    const leagueSetup = document.getElementById('league-setup');
    const tournamentSetup = document.getElementById('tournament-setup');
    const participantCount = document.getElementById('participant-count');

    modeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'league') {
            leagueSetup.style.display = 'block';
            tournamentSetup.style.display = 'none';
        } else {
            leagueSetup.style.display = 'none';
            tournamentSetup.style.display = 'block';
            renderPotsInput(parseInt(participantCount.value, 10));
        }
    });

    participantCount.addEventListener('change', (e) => {
        renderPotsInput(parseInt(e.target.value, 10));
    });
}

function setupThemeToggle() {
    const themeBtn = document.getElementById('btn-theme');
    
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

function renderPotsInput(totalTeams) {
    const container = document.getElementById('pots-container');
    container.innerHTML = "";
    const teamsPerPot = totalTeams / 4;

    for (let i = 1; i <= 4; i++) {
        const div = document.createElement('div');
        div.className = "form-group";
        div.innerHTML = `
            <label>Bombo ${i} (${teamsPerPot} equipos):</label>
            <textarea id="pot-${i}" class="form-control" rows="${teamsPerPot}"></textarea>
        `;
        container.appendChild(div);
    }
}

function renderDrawResults() {
    const container = document.getElementById('draw-results');
    container.innerHTML = "<h3>Resultado del Sorteo</h3>";
    
    const groupsContainer = document.createElement('div');
    groupsContainer.style.display = 'flex';
    groupsContainer.style.flexWrap = 'wrap';
    groupsContainer.style.gap = '15px';

    for (const [groupName, teams] of Object.entries(AppState.groups)) {
        let groupHTML = `
            <div class="group-card">
                <h4>Grupo ${groupName}</h4>
                <ul>
                    ${teams.map(t => `<li>${t.name}</li>`).join('')}
                </ul>
            </div>
        `;
        groupsContainer.innerHTML += groupHTML;
    }
    container.appendChild(groupsContainer);
}

function renderMatches() {
    const container = document.getElementById('matches-container');
    container.innerHTML = "";

    if (AppState.matches.length === 0) {
        container.innerHTML = "<p>No hay partidos generados.</p>";
        return;
    }

    let currentStage = "";

    AppState.matches.forEach(match => {
        if (match.stage !== currentStage) {
            const stageTitle = document.createElement('h3');
            stageTitle.textContent = match.stage;
            stageTitle.style.marginTop = "20px";
            container.appendChild(stageTitle);
            currentStage = match.stage;
        }

        const matchDiv = document.createElement('div');
        matchDiv.className = "match-card";
        matchDiv.innerHTML = `
            <span>${match.teamA.name}</span>
            <div class="match-inputs">
                <input type="number" min="0" id="scoreA-${match.id}" value="${match.isPlayed ? match.scoreA : ''}">
                -
                <input type="number" min="0" id="scoreB-${match.id}" value="${match.isPlayed ? match.scoreB : ''}">
                <button class="btn-primary" style="padding: 5px 10px; margin-left: 10px;" onclick="saveMatchResult('${match.id}')">Guardar</button>
            </div>
            <span>${match.teamB.name}</span>
        `;
        container.appendChild(matchDiv);
    });
}

function renderStandings() {
    const container = document.getElementById('standings-container');
    container.innerHTML = "";

    if (AppState.teams.length === 0) return;

    if (AppState.mode === 'league') {
        const activeTeams = AppState.teams.filter(t => t.id !== 'BYE');
        const sortedTeams = sortStandings([...activeTeams]);
        container.appendChild(createStandingsTable(sortedTeams, "Tabla de Posiciones"));

    } else if (AppState.mode === 'tournament') {
        if (Object.keys(AppState.groups).length === 0) {
            container.innerHTML = "<p>Realiza el sorteo para ver las tablas de grupos.</p>";
            return;
        }

        const groupsWrapper = document.createElement('div');
        groupsWrapper.style.display = 'flex';
        groupsWrapper.style.flexWrap = 'wrap';
        groupsWrapper.style.gap = '20px';

        let thirds = []; 
        const { bestThirdsNeeded } = getTournamentStructureInfo();

        for (const [groupName, groupTeams] of Object.entries(AppState.groups)) {
            const sortedGroupTeams = sortStandings([...groupTeams]);
            if (sortedGroupTeams[2]) thirds.push(sortedGroupTeams[2]); 

            const groupContainer = document.createElement('div');
            groupContainer.style.flex = '1 1 45%';
            groupContainer.style.minWidth = '300px';

            groupContainer.appendChild(createStandingsTable(sortedGroupTeams, `Grupo ${groupName}`));
            groupsWrapper.appendChild(groupContainer);
        }

        container.appendChild(groupsWrapper);

        if (bestThirdsNeeded > 0 && thirds.length > 0) {
            const sortedThirds = sortStandings(thirds);
            const thirdsContainer = document.createElement('div');
            thirdsContainer.style.marginTop = "30px";
            thirdsContainer.style.width = "100%";
            thirdsContainer.appendChild(createStandingsTable(sortedThirds, `Tabla de Mejores Terceros (Clasifican ${bestThirdsNeeded})`));
            container.appendChild(thirdsContainer);
        }
    }
}

function createStandingsTable(teams, titleText) {
    const wrapper = document.createElement('div');
    
    if (titleText) {
        const title = document.createElement('h3');
        title.textContent = titleText;
        wrapper.appendChild(title);
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Equipo</th>
                    <th>Pts</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                    <th>PP</th>
                    <th>GF</th>
                    <th>GC</th>
                    <th>DIF</th>
                </tr>
            </thead>
            <tbody>
    `;

    teams.forEach(team => {
        tableHTML += `
            <tr>
                <td>${team.name}</td>
                <td><strong>${team.points}</strong></td>
                <td>${team.matchesPlayed}</td>
                <td>${team.matchesWon}</td>
                <td>${team.matchesDrawn}</td>
                <td>${team.matchesLost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDifference}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    wrapper.innerHTML += tableHTML;
    return wrapper;
}

window.saveMatchResult = function(matchId) {
    const scoreAInput = document.getElementById(`scoreA-${matchId}`).value;
    const scoreBInput = document.getElementById(`scoreB-${matchId}`).value;

    if (scoreAInput === "" || scoreBInput === "") {
        alert("Debes ingresar ambos resultados.");
        return;
    }

    processMatchResult(matchId, scoreAInput, scoreBInput);
    renderStandings();
    if (AppState.mode === 'tournament') renderKnockout();
};

// =======================================================
// NUEVAS FUNCIONES PARA LA RONDA ELIMINATORIA (BRACKET)
// =======================================================

function renderKnockout() {
    const container = document.getElementById('bracket-container');
    container.innerHTML = "";

    if (!AppState.bracket || !AppState.bracket.rounds || AppState.bracket.rounds.length === 0) {
        container.innerHTML = `<p>El fixture eliminatorio se visualizará al inicializar el torneo.</p>`;
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.display = "flex";
    wrapper.style.gap = "20px";
    wrapper.style.overflowX = "auto";
    wrapper.style.paddingTop = "10px";

    AppState.bracket.rounds.forEach(round => {
        const roundCol = document.createElement('div');
        roundCol.style.minWidth = "260px";
        roundCol.innerHTML = `<h3>${round.name}</h3>`;

        round.matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.style.border = "1px solid var(--border-color)";
            matchDiv.style.marginBottom = "15px";
            matchDiv.style.padding = "5px";
            matchDiv.style.borderRadius = "4px";
            matchDiv.style.backgroundColor = "var(--card-bg)";

            const teamAClass = match.winnerId && match.teamA && match.winnerId == match.teamA.id ? 'bracket-team winner' : 'bracket-team';
            const teamBClass = match.winnerId && match.teamB && match.winnerId == match.teamB.id ? 'bracket-team winner' : 'bracket-team';

            // Parámetros dinámicos de renderizado (Slot temporal vs Equipo clasificado)
            const labelA = match.teamA ? match.teamA.name : (match.slotA ? match.slotA.label : "Por definir");
            const colorA = match.teamA ? "var(--text-main)" : "var(--text-muted)";
            const pointerA = match.teamA ? `onclick="selectWinner('${match.id}', '${match.teamA.id}')"` : "";

            const labelB = match.teamB ? match.teamB.name : (match.slotB ? match.slotB.label : "Por definir");
            const colorB = match.teamB ? "var(--text-main)" : "var(--text-muted)";
            const pointerB = match.teamB ? `onclick="selectWinner('${match.id}', '${match.teamB.id}')"` : "";

            const tA = `
                <div class="${teamAClass}" style="display: flex; justify-content: space-between; align-items: center; color: ${colorA};" ${pointerA}>
                    <span style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${labelA}</span>
                    <input type="text" class="form-control" style="width: 55px; height: 35px; text-align: center; padding: 2px; margin-left: 10px;" placeholder="-" value="${match.scoreA || ''}" onchange="updateKnockoutScore('${match.id}', 'A', this.value)" onclick="event.stopPropagation()" ${!match.teamA ? 'disabled' : ''}>
                </div>`;

            const tB = `
                <div class="${teamBClass}" style="display: flex; justify-content: space-between; align-items: center; color: ${colorB};" ${pointerB}>
                    <span style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${labelB}</span>
                    <input type="text" class="form-control" style="width: 55px; height: 35px; text-align: center; padding: 2px; margin-left: 10px;" placeholder="-" value="${match.scoreB || ''}" onchange="updateKnockoutScore('${match.id}', 'B', this.value)" onclick="event.stopPropagation()" ${!match.teamB ? 'disabled' : ''}>
                </div>`;

            matchDiv.innerHTML = `${tA}${tB}`;
            roundCol.appendChild(matchDiv);
        });
        wrapper.appendChild(roundCol);
    });

    container.appendChild(wrapper);
}

window.updateKnockoutScore = function(matchId, teamKey, value) {
    let foundMatch = null;
    AppState.bracket.rounds.forEach(r => {
        r.matches.forEach(m => { if (m.id === matchId) foundMatch = m; });
    });
    if (foundMatch) {
        if (teamKey === 'A') foundMatch.scoreA = value;
        else if (teamKey === 'B') foundMatch.scoreB = value;
    }
};

window.selectWinner = function(matchId, teamId) {
    let foundMatch = null;
    AppState.bracket.rounds.forEach(r => {
        r.matches.forEach(m => { if (m.id === matchId) foundMatch = m; });
    });

    if (!foundMatch || !foundMatch.scoreA || !foundMatch.scoreB || foundMatch.scoreA.trim() === "" || foundMatch.scoreB.trim() === "") {
        alert("Debes escribir el resultado para ambos equipos antes de seleccionar al ganador.");
        return;
    }

    foundMatch.winnerId = teamId;
    let winnerTeam = teamId == foundMatch.teamA.id ? foundMatch.teamA : foundMatch.teamB;

    if (foundMatch.nextMatchId) {
        let nextMatch = null;
        AppState.bracket.rounds.forEach(r => {
            r.matches.forEach(m => { if (m.id === foundMatch.nextMatchId) nextMatch = m; });
        });
        if (nextMatch) {
            if (foundMatch.positionInNext === 'teamA') nextMatch.teamA = winnerTeam;
            else nextMatch.teamB = winnerTeam;
        }
    }

    renderKnockout();
};
