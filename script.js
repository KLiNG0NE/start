// Standard-Konfiguration (wird beim allerersten Besuch geladen)
const defaultConfig = {
    bgImage: 'https://picsum.photos/1920/1080', // Leer = dunkler Standardhintergrund
    searchEngine: 'https://www.startpage.com/sp/search?query=%s',
    links: [
        { name: 'StartPage', url: 'https://www.startpage.com' },
        { name: 'DuckDuckGo', url: 'https://duckduckgo.com/' },
        { name: 'Qwant', url: 'https://www.qwant.com/' },
        { name: 'Ecosia', url: 'https://www.ecosia.org/' },
        { name: 'Wikipedia', url: 'https://wikipedia.org' },
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Reddit', url: 'https://reddit.com' },
        { name: 'Amazon Luna', url: 'https://luna.amazon.de/claims/home' },
        { name: 'Epic Games', url: 'https://store.epicgames.com' }
    ]
};

let currentConfig = {};

// Lädt die Config aus dem LocalStorage oder nutzt die Standard-Config
function loadConfig() {
    const saved = localStorage.getItem('myStartpageConfig');
    if (saved) {
        currentConfig = JSON.parse(saved);
    } else {
        currentConfig = JSON.parse(JSON.stringify(defaultConfig)); // Deep Copy
    }
    applyConfig();
}

// Wendet die Config auf die Webseite an
function applyConfig() {
    const bgContainer = document.getElementById('bg-container');

    // 1. Hintergrundbild mit Fade-In laden
    if (currentConfig.bgImage) {
        // Container erst einmal ausblenden (für den Fade-Effekt)
        bgContainer.style.opacity = '0';
        
        // Ein neues Image-Objekt erstellen, um das Bild im Hintergrund zu laden (Preloading)
        const img = new Image();
        
        img.onload = function() {
            // Erst wenn das Bild komplett geladen ist, wird es als Hintergrund gesetzt
            bgContainer.style.backgroundImage = `url('${currentConfig.bgImage}')`;
            bgContainer.style.backgroundColor = 'transparent';
            
            // Kurzen Moment warten (damit der Browser den Wechsel der CSS-Eigenschaften registriert)
            setTimeout(() => {
                // Container sanft einblenden
                bgContainer.style.opacity = '1';
            }, 50);
        };
        
        img.onerror = function() {
            // Falls das Bild nicht geladen werden kann (z.B. URL ungültig)
            bgContainer.style.backgroundImage = 'none';
            bgContainer.style.backgroundColor = '#1a1a1a';
            bgContainer.style.opacity = '1';
        };
        
        // Ladevorgang starten
        img.src = currentConfig.bgImage;
        
    } else {
        // Wenn kein Bild eingestellt ist, sofort den dunklen Hintergrund zeigen
        bgContainer.style.backgroundImage = 'none';
        bgContainer.style.backgroundColor = '#1a1a1a';
        bgContainer.style.opacity = '1';
    }

    // 2. Suchmaschine
    document.getElementById('search-form').action = currentConfig.searchEngine;
    document.getElementById('search-input').name = 'q';

    // 3. Links generieren
    renderLinks();
}

// Generiert die HTML-Buttons für die Links
function renderLinks() {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = ''; // Alte Links löschen

    currentConfig.links.forEach(link => {
        let domain = '';
        try {
            domain = new URL(link.url).hostname;
        } catch (e) {
            domain = link.url;
        }

        // Favicon API von Google nutzen (zuverlässig für fast alle Seiten)
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'link-btn';
        a.target = '_blank'; // In neuem Tab öffnen
        a.rel = 'noopener noreferrer';

        a.innerHTML = `
            <img src="${faviconUrl}" alt="${link.name} Icon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>'">
            <span>${link.name}</span>
        `;

        grid.appendChild(a);
    });
}

// Suchfunktion anpassen (da wir kein target="_blank" wollen)
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value;
    const searchUrl = currentConfig.searchEngine.replace('%s', encodeURIComponent(query));
    window.location.href = searchUrl;
});

// --- WETTER (Geändert für Open-Meteo) ---
async function fetchWeather() {
    const weatherDiv = document.getElementById('weather');
    
    // Hinweis: Benötigt einen Webserver (nicht direkt file:// öffnen!)
    try {
        // Open-Meteo API (Kostenlos, Keine Key, CORS-Freundlich)
        // Standard-Lage: Berlin. Du kannst die Koordinaten anpassen oder IP-Location nutzen.
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=9.9846&longitude=13.4&current=temperature_2m,weathercode,wind_speed_10m';

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('API Fehler');
        }

        const data = await response.json();
        const current = data.current;

        // Wettercodes in Text übersetzen
        const weatherMap = { 
            0: 'Sonnenschein ☀', 1: 'Teils bewölkt ☁️', 2: 'Überwiegend bedeckt 🌥',
            3: 'Bewölkt ☁️', 45: 'Nebel ⛅', 48: 'Nebel ⛅', 
            51: 'Leichter Regen 🌦', 61: 'Regen 🌧', 71: 'Schauer 🌦',
            95: 'Gewitter ⛈', 96: 'Gewitter + Hagel ⚡'
        };

        const icon = weatherMap[current.weathercode] || '❓';
        
        // Anzeigen
        weatherDiv.innerHTML = `📍 Neumünster<br>Temp: ${current.temperature_2m}°C<br>${icon}<br>Wind: ${current.wind_speed_10m} km/h`;

    } catch (error) {
        console.error('Wetter-Fehler:', error);
        weatherDiv.textContent = 'Wetterdaten nicht verfügbar (Bitte Seite via HTTP Server laden)';
    }
}

// --- EINSTELLUNGS-MODAL ---

const modal = document.getElementById('settings-modal');
const settingsBtn = document.getElementById('settings-btn');
const closeBtn = document.querySelector('.close-btn');
const saveBtn = document.getElementById('save-btn');
const bgFileInput = document.getElementById('bg-file-input');

settingsBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    populateSettingsForm();
});

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Füllt das Einstellungsformular mit den aktuellen Daten
function populateSettingsForm() {
    document.getElementById('bg-url-input').value = currentConfig.bgImage.startsWith('data:') ? '' : currentConfig.bgImage;
    document.getElementById('se-input').value = currentConfig.searchEngine;
    
    // Links in Textarea umwandeln (Format: Name | URL)
    const linksText = currentConfig.links.map(l => `${l.name} | ${l.url}`).join('\n');
    document.getElementById('links-input').value = linksText;
    
    bgFileInput.value = ''; // File Input zurücksetzen
}

// Speichert die Einstellungen
saveBtn.addEventListener('click', () => {
    const newBgUrl = document.getElementById('bg-url-input').value;
    const newSearchEngine = document.getElementById('se-input').value;
    const linksText = document.getElementById('links-input').value;

    // Links aus Textarea parsen
    const newLinks = linksText.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            const parts = line.split('|');
            if (parts.length >= 2) {
                return { name: parts[0].trim(), url: parts[1].trim() };
            }
            return null;
        })
        .filter(link => link !== null && link.url.startsWith('http'));

    currentConfig.searchEngine = newSearchEngine || defaultConfig.searchEngine;
    currentConfig.links = newLinks.length > 0 ? newLinks : defaultConfig.links;

    // Wenn eine Datei ausgewählt wurde, diese priorisieren
    if (bgFileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentConfig.bgImage = e.target.result; // Base64 String
            saveToLocalStorage();
        };
        reader.readAsDataURL(bgFileInput.files[0]);
    } else {
        currentConfig.bgImage = newBgUrl;
        saveToLocalStorage();
    }
});

function saveToLocalStorage() {
    try {
        localStorage.setItem('myStartpageConfig', JSON.stringify(currentConfig));
        applyConfig();
        modal.classList.add('hidden');
    } catch (e) {
        alert('Fehler beim Speichern! Wahrscheinlich ist das hochgeladene Bild zu groß für den lokalen Speicher (max. ca. 5MB). Bitte nutze eine Bild-URL statt einer Datei.');
        console.error(e);
    }
}

// --- UHR ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}`;
}

// Initialisierung
loadConfig();
updateClock();
setInterval(updateClock, 1000);
fetchWeather();
