document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de la interfaz
    setupTabs();
    setupModeToggle();
    setupThemeToggle();

    // Eventos de persistencia
    document.getElementById('btn-save').addEventListener('click', saveTournament);
    document.getElementById('input-load').addEventListener('change', loadTournament);

    // Evento del Sorteo (Modo Torneo)
    document.getElementById('btn-draw').addEventListener('click', () => {
        const mode = document.getElementById('mode-select').value;
        if (mode !== 'tournament') return;

        let globalTeamId = 0;
        let potsData = [];
        let totalTeamsExpected = parseInt(document.getElementById('participant-count').value, 10);
        let teamsPerPot = totalTeamsExpected / 4;

        AppState.teams = [];

        // Leer y validar los 4 bombos
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

    // Evento de Generación de Fixture
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