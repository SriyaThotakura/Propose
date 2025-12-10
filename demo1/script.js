// Global GeoJSON Data Storage
let globalCityTypeGeoJSON;
let globalTrivariateGeoJSON;

// UI Element References
let playPauseBtn;
let restartBtn;
let timelineProgress;
let timelineMarker;
let currentLayerDisplay;
const loadingElement = document.getElementById('loading');

// Animation control variables
let isPlaying = false;
let animationStartTime = 0;
let animationDuration = 120000; // 2 Minutes
let lastFrameTime = 0;
let animationFrameId = null;

// Initialize the map
const map = L.map('map', {
    zoomControl: false,
    zoomSnap: 0.25,
    preferCanvas: false // MUST BE FALSE for CSS Animations (Pink Cloud)
}).setView([40.8448, -73.8648], 12);

// Create a custom pane for our special effects layers
map.createPane('trivariatePane');
map.getPane('trivariatePane').style.zIndex = 450; 

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '', 
    maxZoom: 19
}).addTo(map);

// Initialize layers
let cityTypeLayer;
let kdeLayer;
let trivariateLayer;

// --- STEP 1: STYLE DEFINITIONS ---

function getCityTypeColor(type) {
    switch (type) {
        case 'Feral City': return '#FF4500'; 
        case 'Human City': return '#4169E1'; 
        case 'Green City': return '#00FF7F'; 
        case 'Gray City':  return '#A9A9A9'; 
        default: return '#CCCCCC';
    }
}

function getCityTypeStyle(feature) {
    const type = feature.properties.City_Type;
    const color = getCityTypeColor(type);
    
    let fillOpacity = 0.1;
    if(type === 'Feral City') fillOpacity = 0.4;
    else if(type === 'Human City') fillOpacity = 0.3;
    else if(type === 'Green City') fillOpacity = 0.3;
    else if(type === 'Gray City') fillOpacity = 0.2;
    
    return { 
        fillColor: color, 
        color: color, 
        weight: 1, 
        opacity: 0.8, 
        fillOpacity: fillOpacity 
    };
}

const trivariateStyle = {
    fill: false,
    color: '#FFD700', // Gold
    weight: 8,        
    opacity: 1,
    className: 'isosurface-glow-line'
};

// --- STEP 2: LOAD FUNCTIONS ---

async function loadData() {
    try {
        console.log("Attempting to load data...");
        
        const [cityRes, triRes] = await Promise.all([
            fetch('data/City_Type.geojson'),
            fetch('data/Secondary_Intervention_Residential_TRIVARIATE.geojson')
        ]);

        if (!cityRes.ok) throw new Error("City_Type fetch failed");
        if (!triRes.ok) throw new Error("Trivariate fetch failed");

        globalCityTypeGeoJSON = await cityRes.json();
        globalTrivariateGeoJSON = await triRes.json();

        // Initialize UI
        playPauseBtn = document.getElementById('play-pause');
        restartBtn = document.getElementById('restart');
        timelineProgress = document.querySelector('.timeline-progress');
        timelineMarker = document.querySelector('.timeline-marker');
        currentLayerDisplay = document.getElementById('current-layer');

        // Create the FAST FORWARD button
        createDebugButton();

        // Initial Load
        loadClassifiedCityType(globalCityTypeGeoJSON);
        setupEventListeners();
        hideLoadingScreen();
        
    } catch (error) {
        console.error("DATA LOAD ERROR:", error);
        document.getElementById('overlay').innerHTML = `
            <h1 style="color:red; border-bottom: 1px solid red;">DATA LOAD ERROR</h1>
            <p>Check console (F12) for details.</p>`;
        hideLoadingScreen();
    }
}

// Layer 1: Base Map
function loadClassifiedCityType(data) {
    if (cityTypeLayer) map.removeLayer(cityTypeLayer);
    
    cityTypeLayer = L.geoJSON(data, {
        style: getCityTypeStyle,
        onEachFeature: (feature, layer) => {
             const p = feature.properties;
             if (p.City_Type) {
                 const typeColor = getCityTypeColor(p.City_Type);
                 const area = p.Shape_Area_sum ? Math.round(p.Shape_Area_sum).toLocaleString() : 'N/A';
                 const popupContent = `
                    <div style="font-family: var(--monospace-font); min-width: 200px;">
                        <strong style="color: ${typeColor}; border-bottom: 1px solid ${typeColor}; display:block;">
                            ${p.City_Type.toUpperCase()}
                        </strong>
                        <div style="font-size: 0.9em; margin-top: 5px;">
                            Total Area: ${area}
                        </div>
                    </div>
                 `;
                 layer.bindPopup(popupContent);
             }
        }
    }).addTo(map);

    map.fitBounds(cityTypeLayer.getBounds());
}

// Layer 2: ACTIVE KDE SIMULATION (STRICT GRAY CITY FILTER)
function showKDEVisualization() {
    if (kdeLayer && map.hasLayer(kdeLayer)) return; 

    console.log("Activating KDE Simulation (Gray City Only)...");

    // STRICT FILTER: Only features where City_Type is EXACTLY 'Gray City'
    const grayCityFeatures = globalCityTypeGeoJSON.features.filter(f => {
        return f.properties && f.properties.City_Type === 'Gray City';
    });
    
    const grayCityData = {
        type: "FeatureCollection",
        features: grayCityFeatures
    };

    kdeLayer = L.geoJSON(grayCityData, {
        pane: 'trivariatePane', 
        style: {
            fillColor: 'rgba(255, 107, 157, 0.4)', // Pink
            color: 'transparent',
            weight: 0,
            fillOpacity: 0.6, // Visible Cloud
            interactive: false,
            className: 'kde-simulation-layer' 
        }
    }).addTo(map);
}

// Layer 3: Gold Line (Trivariate)
function loadTrivariateIsoSurface() {
    if (!globalTrivariateGeoJSON) return;
    if (trivariateLayer && map.hasLayer(trivariateLayer)) return; 
    
    // Dim the base layer
    if (cityTypeLayer) {
        cityTypeLayer.eachLayer(l => l.setStyle({ opacity: 0.3, fillOpacity: 0.1 }));
    }

    trivariateLayer = L.geoJSON(globalTrivariateGeoJSON, {
        pane: 'trivariatePane', 
        style: trivariateStyle,
        onEachFeature: (feature, layer) => {
            const p = feature.properties;
            
            // CORRECT DATA MAPPING
            const V = p.CVI_mean !== undefined ? p.CVI_mean : 0; 
            const P = p.Canopy_Pct_majority !== undefined ? p.Canopy_Pct_majority : 0; 
            const R = p.Asthma_I_R_mean_mean_majority !== undefined ? p.Asthma_I_R_mean_mean_majority : 0; 
            
            const compositeScore = (V + (P/10) + (R/100)).toFixed(2); 

            const popupContent = `
                <div style="font-family: var(--monospace-font); min-width: 250px;">
                    <strong style="color: var(--glowing-gold); border-bottom: 1px solid var(--glowing-gold); display:block; margin-bottom:5px;">
                        ISO-SURFACE BOUNDARY
                    </strong>
                    <div style="margin-bottom: 10px;">
                        Vulnerability (CVI): <strong style="color: #fff;">${V.toFixed(2)}</strong><br>
                        Policy (Canopy): <strong style="color: #fff;">${P.toFixed(1)}%</strong><br>
                        Res. Risk (Asthma): <strong style="color: #fff;">${R.toFixed(1)}</strong>
                    </div>
                    <div style="border-top: 1px dashed var(--neon-green); padding-top: 5px; margin-top: 5px;">
                        <strong>Composite Index: ${compositeScore}</strong>
                    </div>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    console.log("Layer 3 Loaded & Brought to Front");
}

// --- CONTROLS & TIMELINE ---

function checkDemoTimeline(elapsed) {
    if (elapsed < 30000) {
        // Phase 1: Base Map
        if (kdeLayer && map.hasLayer(kdeLayer)) map.removeLayer(kdeLayer);
        if (trivariateLayer && map.hasLayer(trivariateLayer)) map.removeLayer(trivariateLayer);
        if (cityTypeLayer) {
            cityTypeLayer.eachLayer(l => {
                const originalStyle = getCityTypeStyle(l.feature);
                l.setStyle({ opacity: originalStyle.opacity, fillOpacity: originalStyle.fillOpacity });
            });
        }
    } 
    else if (elapsed >= 30000 && elapsed < 60000) {
        // Phase 2: Pink Cloud
        if (!kdeLayer || !map.hasLayer(kdeLayer)) showKDEVisualization();
        if (trivariateLayer && map.hasLayer(trivariateLayer)) map.removeLayer(trivariateLayer);
    } 
    else if (elapsed >= 60000) {
        // Phase 3: Gold Line
        if (kdeLayer && map.hasLayer(kdeLayer)) map.removeLayer(kdeLayer);
        if (!trivariateLayer || !map.hasLayer(trivariateLayer)) loadTrivariateIsoSurface();
    }
}

function animate() {
    if (!isPlaying) return;
    const now = Date.now();
    const elapsed = now - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    const progressPercent = progress * 100;
    timelineProgress.style.width = `${progressPercent}%`;
    timelineMarker.style.left = `${progressPercent}%`;
    
    checkDemoTimeline(elapsed);
    updateLayerDisplay(progress);
    
    if (progress < 1) {
        lastFrameTime = progress;
        animationFrameId = requestAnimationFrame(animate);
    } else {
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
}

function updateLayerDisplay(progress) {
    if (!currentLayerDisplay) return;
    if (progress < 0.25) currentLayerDisplay.innerHTML = `Layer 1: **Classified City Zones**`;
    else if (progress < 0.50) currentLayerDisplay.innerHTML = `Layer 2: **Active KDE Simulation** (Gray City Only)`;
    else currentLayerDisplay.innerHTML = `Layer 3: **Iso-Surface Proof**`;
}

function createDebugButton() {
    const controls = document.getElementById('controls');
    if(document.getElementById('debug-btn')) return; 
    
    const btn = document.createElement('button');
    btn.id = 'debug-btn';
    btn.innerHTML = '<i class="fas fa-forward"></i>';
    btn.title = "Jump to Final Layer (Debug)";
    
    // Jump to 61 seconds (Layer 3)
    btn.onclick = () => {
        animationStartTime = Date.now() - 61000; 
        checkDemoTimeline(61000); 
        updateLayerDisplay(0.51);
        timelineProgress.style.width = '51%';
        timelineMarker.style.left = '51%';
        if(!isPlaying) togglePlayPause();
    };
    controls.appendChild(btn);
}

function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlayPause);
    restartBtn.addEventListener('click', restartAnimation);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
    });
}

function hideLoadingScreen() {
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => loadingElement.style.display = 'none', 500);
    }
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (!animationStartTime || lastFrameTime === 1) restartAnimation();
        else animationStartTime = Date.now() - (lastFrameTime * animationDuration);
        animate();
    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
}

function restartAnimation() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    isPlaying = false;
    animationStartTime = 0;
    lastFrameTime = 0;
    
    checkDemoTimeline(0);
    
    timelineProgress.style.width = '0%';
    timelineMarker.style.left = '0%';
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    currentLayerDisplay.innerHTML = `Layer 1: **Classified City Zones**`;
}

loadData();