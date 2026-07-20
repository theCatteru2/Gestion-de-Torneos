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
    
    // Verificar si hay un tema guardado previamente en el almacenamiento local
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            // Guardar la preferencia actual
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

    // Filtrar el equipo 'BYE' utilizado para balances impares y ordenar
    const activeTeams = AppState.teams.filter(t => t.id !== 'BYE');
    const sortedTeams = sortStandings([...activeTeams]);

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

    sortedTeams.forEach(team => {
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
    container.innerHTML = tableHTML;
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
    alert("Resultado guardado y tabla actualizada.");
};