// Beispiel-Konfiguration, kann später durch eine JSON-Datei ersetzt werden
const config = {
  "backgroundImage": "https://example.com/dein-hintergrundbild.jpg",
  "websites": [
    {"name": "Google", "url": "https://www.google.com"},
    {"name": "YouTube", "url": "https://www.youtube.com"},
    {"name": "Twitter", "url": "https://twitter.com"},
    {"name": "GitHub", "url": "https://github.com"}
  ]
};

// Funktion, um Favicons zu laden
function getFavicon(url) {
  const domain = new URL(url).origin;
  return `${domain}/favicon.ico`;
}

// Hintergrundbild setzen
document.body.style.backgroundImage = `url('${config.backgroundImage}')`;

// Buttons erstellen
const containerWebsites = document.getElementById('websites');

config.websites.forEach(site => {
  const btn = document.createElement('button');
  btn.className = 'website-button';
  btn.onclick = () => window.open(site.url, '_blank');

  const faviconUrl = getFavicon(site.url);
  const img = document.createElement('img');
  img.src = faviconUrl;
  img.onerror = () => {
    // Falls kein Favico gefunden, Text anzeigen
    img.style.display = 'none';
  };

  btn.appendChild(img);
  const span = document.createElement('span');
  span.textContent = site.name;
  btn.appendChild(span);

  containerWebsites.appendChild(btn);
});
