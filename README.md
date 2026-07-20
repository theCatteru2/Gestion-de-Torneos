# 🏆 Gestionador de Torneos de Fútbol

Una aplicación web interactiva desarrollada en JavaScript Vanilla para la creación, administración y seguimiento de ligas de fútbol y torneos personalizados con fase de grupos y sorteos.

---

## 📌 Características Principales

* **Modo Liga Básica:**
  * Generación automática de fixtures utilizando el algoritmo de Round-Robin (todos contra todos).
  * Tabla de posiciones actualizada en tiempo real según el desarrollo de los partidos.
  * Criterios de desempate ordenados estrictamente por: **Puntos → Diferencia de Gol → Partidos Ganados**.

* **Modo Torneo Personalizado:**
  * Configuración flexible desde **4 hasta 64 participantes** (múltiplos de 4).
  * Sistema de **4 bombos** para distribución equitativa de cabezas de serie.
  * Sorteo aleatorio transparente de grupos (4 equipos por grupo) implementando el algoritmo de Fisher-Yates.

* **Gestión de Datos y Persistencia:**
  * Exportación del estado completo del torneo a un archivo local `.json`.
  * Importación de archivos `.json` previamente guardados para reanudar la gestión en cualquier momento sin perder datos.

* **Interfaz Adaptativa:**
  * Sistema de pestañas para navegación fluida entre Configuración, Partidos, Tablas y Eliminatorias.
  * Selector de **Modo Oscuro / Modo Claro** con persistencia en el navegador mediante `localStorage`.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructura semántica de la aplicación.
* **CSS3:** Variables CSS para el manejo de temas visuales y diseño responsivo.
* **JavaScript (ES6+):** Programación orientada a objetos (POO), manipulación dinámica del DOM y lógica algorítmica sin dependencias externas.

---

## 📂 Estructura del Proyecto

```text
gestionador-torneos/
│
├── index.html          # Estructura principal e interfaz de usuario
├── css/
│   └── styles.css      # Reglas de estilo y definición de temas
└── js/
    ├── models.js       # Modelos de datos (Team, Match, AppState)
    ├── logic.js        # Algoritmos de ordenamiento, sorteos y fixture
    ├── ui.js           # Renderizado dinámico del DOM y eventos visuales
    ├── storage.js      # Persistencia de datos (Exportación e Importación JSON)
    └── app.js          # Controlador principal e inicializador de eventos
