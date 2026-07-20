function saveTournament() {
    if (AppState.teams.length === 0) {
        alert("No hay ningún torneo activo para guardar.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "torneo_datos.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadTournament(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const loadedState = JSON.parse(e.target.result);
            
            AppState.mode = loadedState.mode;
            AppState.groups = loadedState.groups || {};
            AppState.bracket = loadedState.bracket || {};
            
            AppState.teams = loadedState.teams.map(t => Object.assign(new Team(t.id, t.name), t));
            AppState.matches = loadedState.matches.map(m => Object.assign(new Match(m.id, m.teamA, m.teamB, m.stage), m));

            renderMatches();
            renderStandings();
            
            if (AppState.mode === 'tournament' && Object.keys(AppState.groups).length > 0) {
                renderDrawResults();
            }
            
            alert("Torneo cargado correctamente.");
            document.querySelector('.tab-btn[data-target="matches"]').click();
        } catch (error) {
            console.error("Error durante la lectura del archivo:", error);
            alert("Error al cargar el archivo JSON. Verifica que sea un archivo válido generado por esta aplicación.");
        }
    };
    reader.readAsText(file);
}
