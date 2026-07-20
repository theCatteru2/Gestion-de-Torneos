document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupModeToggle();
    setupThemeToggle();

    document.getElementById('btn-save').addEventListener('click', saveTournament);
    document.getElementById('input-load').addEventListener('change', loadTournament);

    document.getElementById('btn-draw').addEventListener('click', () => {
        const mode = document.getElementById('mode-select').value;
        if (mode !== 'tournament') return;

        let globalTeamId = 1;
        let potsData = [];
        let totalTeamsExpected = parseInt(document.getElementById('participant-count').value, 10);
        let teamsPerPot = totalTeamsExpected / 4;

        AppState.teams = [];

        for (let i = 1; i <= 4; i++) {
            const potText = document.getElementById(`pot-${i}`).value;
            const names = potText.split('\n').map(n => n.trim()).filter(n => n !== "");
            
            if (names.length !== teamsPerPot) {
                alert(`El Bombo ${i} debe tener exactamente ${teamsPerPot} equipos.`);
                return;
            }

            let potTeams = names.map(name => {
                let team = new Team(globalTeamId++, name);
                AppState.teams.push(team);
                return team;
            });
            potsData.push(potTeams);
        }

        AppState.mode = 'tournament';
        executeDraw(potsData);
        renderDrawResults();
    });

    document.getElementById('btn-generate').addEventListener('click', () => {
        const mode = document.getElementById('mode-select').value;
        
        if (mode === 'league') {
            const teamNamesText = document.getElementById('team-input').value;
            if (initializeLeague(teamNamesText)) {
                renderMatches();
                renderStandings();
                document.querySelector('.tab-btn[data-target="matches"]').click();
            }
        } else if (mode === 'tournament') {
            if (Object.keys(AppState.groups).length === 0) {
                alert("Debes realizar el sorteo primero.");
                return;
            }
            generateGroupStageMatches();
            renderMatches();
            renderStandings();
            document.querySelector('.tab-btn[data-target="matches"]').click();
        }
    });
});
