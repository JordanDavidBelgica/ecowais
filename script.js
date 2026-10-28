// Application State
let currentUser = null;
let userType = null;

// Enhanced Map and Tracking Variables
let map = null;
let truckMarkers = {};
let routeLines = {};
let markerClusterGroup = null;
let trafficLayer = null;
let autoRefreshInterval = null;
let isAutoRefreshEnabled = true;

// Map Configuration
const MAP_CONFIG = {
    center: [13.4117, 121.1800], // Calapan City center
    zoom: 13,
    minZoom: 10,
    maxZoom: 18
};

// Tile Layer Options
const TILE_LAYERS = {
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS'
    },
    terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap contributors'
    }
};

// Enhanced Truck Data with Real GPS Coordinates
const ENHANCED_TRUCK_DATA = [
    {
        id: '001',
        driver: 'Jordan Manalo',
        location: 'Barangay San Vicente',
        lat: 13.4145,
        lng: 121.1832,
        route: 'City Proper - San Vicente Route',
        progress: '2/6 stops',
        eta: '2:45 PM',
        status: 'active',
        fuel: 70,
        speed: 20,
        bearing: 45,
        lastUpdate: new Date(),
        pickupPoints: [
            {lat: 13.4128, lng: 121.1810, address: 'Calapan City Hall', status: 'completed'},
            {lat: 13.4139, lng: 121.1825, address: 'Xentro Mall Calapan', status: 'current'},
            {lat: 13.4152, lng: 121.1840, address: 'San Vicente Barangay Hall', status: 'pending'}
        ]
    },
    {
        id: '002',
        driver: 'Jhona Dancel',
        location: 'Barangay Bayanan I',
        lat: 13.4082,
        lng: 121.1815,
        route: 'Bayanan Route A',
        progress: '4/8 stops',
        eta: '3:30 PM',
        status: 'active',
        fuel: 55,
        speed: 25,
        bearing: 180,
        lastUpdate: new Date(),
        pickupPoints: [
            {lat: 13.4090, lng: 121.1820, address: 'Bayanan National High School', status: 'completed'},
            {lat: 13.4075, lng: 121.1810, address: 'Puregold Calapan', status: 'current'},
            {lat: 13.4068, lng: 121.1800, address: 'Jollibee Bayanan', status: 'pending'}
        ]
    },
    {
        id: '003',
        driver: 'Cj Belgica',
        location: 'Barangay Lumangbayan',
        lat: 13.4200,
        lng: 121.1850,
        route: 'Lumangbayan Route',
        progress: '5/5 stops',
        eta: 'Completed',
        status: 'completed',
        fuel: 90,
        speed: 0,
        bearing: 0,
        lastUpdate: new Date(),
        pickupPoints: []
    },
    {
        id: '004',
        driver: 'Jose Lumanglas',
        location: 'Barangay Guinobatan',
        lat: 13.4175,
        lng: 121.1925,
        route: 'Guinobatan South Route',
        progress: '3/7 stops',
        eta: '4:15 PM',
        status: 'active',
        fuel: 65,
        speed: 18,
        bearing: 270,
        lastUpdate: new Date(),
        pickupPoints: [
            {lat: 13.4165, lng: 121.1910, address: 'Guinobatan Elementary School', status: 'completed'},
            {lat: 13.4180, lng: 121.1930, address: 'Guinobatan Barangay Hall', status: 'current'}
        ]
    },
    {
        id: '005',
        driver: 'Lean Kim',
        location: 'Barangay Lalud',
        lat: 13.4230,
        lng: 121.1750,
        route: 'Lalud Route B',
        progress: '1/6 stops',
        eta: '5:00 PM',
        status: 'idle',
        fuel: 80,
        speed: 0,
        bearing: 90,
        lastUpdate: new Date(),
        pickupPoints: [
            {lat: 13.4240, lng: 121.1760, address: 'Lalud Barangay Hall', status: 'current'}
        ]
    }
];

// User permissions configuration (keeping original)
const rolePermissions = {
   resident: {
        pages: ['resident'],
        features: ['report-issues', 'mark-attendance', 'view-attendance']
    },
    driver: {
        pages: [ 'driver', 'tracking'],
        features: ['view-routes', 'update-status', 'report-issues', 'view-tracking']
    },
    admin: {
        pages: ['dashboard', 'resident', 'driver', 'admin', 'tracking'],
        features: ['all']
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 EcoWais System Initializing...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Set default date to today for pickup scheduling
    const today = new Date().toISOString().split('T')[0];
    const pickupDateEl = document.getElementById('pickup-date');
    if (pickupDateEl) {
        pickupDateEl.setAttribute('min', today);
    }
    
    // Initialize with login page
    showLoginPage();
    
    console.log('✅ EcoWais System Initialized');
});

// Setup all event listeners
function setupEventListeners() {
    // Login and forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) scheduleForm.addEventListener('submit', schedulePickup);
    
    const reportForm = document.getElementById('report-form');
    if (reportForm) reportForm.addEventListener('submit', submitReport);
    
    // Tracking controls
    const truckFilter = document.getElementById('truck-filter');
    if (truckFilter) truckFilter.addEventListener('change', filterTrucks);
    
    const viewMode = document.getElementById('view-mode');
    if (viewMode) viewMode.addEventListener('change', changeMapView);
    
    const updateInterval = document.getElementById('update-interval');
    if (updateInterval) updateInterval.addEventListener('change', changeUpdateInterval);
    
    const truckSearch = document.getElementById('truck-search');
    if (truckSearch) truckSearch.addEventListener('input', searchTrucks);

    // Modal close button listener (for the new modal system)
    const modalCloseButton = document.querySelector('.modal .close');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
    const modalOverlay = document.getElementById('app-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

// ==============================================
// ENHANCED MAP INITIALIZATION & MANAGEMENT
// ==============================================

// Initialize Leaflet Map with Enhanced Features
function initializeTrackingMap() {
    console.log('🗺️ Initializing Enhanced Tracking Map...');
    
    if (map) {
        map.remove(); // Clean up existing map
    }
    
    // Create map with enhanced options
    map = L.map('tracking-map', {
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: true,
        attributionControl: true
    });
    
    // Add initial tile layer (street view)
    let currentTileLayer = L.tileLayer(TILE_LAYERS.street.url, {
        attribution: TILE_LAYERS.street.attribution,
        maxZoom: 18
    }).addTo(map);
    
    // Initialize marker cluster group
    markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        maxClusterRadius: 50
    });
    map.addLayer(markerClusterGroup);
    
    // Add scale control
    L.control.scale({
        position: 'bottomleft'
    }).addTo(map);
    
    // Add custom controls
    addCustomMapControls();
    
    // Load initial truck data
    loadTruckMarkers();
    
    // Add depot/base markers
    addDepotMarkers();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('✅ Enhanced Tracking Map Initialized');
}

// Add custom map controls
function addCustomMapControls() {
    // Custom control for centering on fleet
    const CenterControl = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.style.backgroundColor = 'white';
            container.style.width = '40px';
            container.style.height = '40px';
            container.style.cursor = 'pointer';
            container.title = 'Center on Fleet';
            container.innerHTML = '🎯';
            container.style.fontSize = '20px';
            container.style.textAlign = 'center';
            container.style.lineHeight = '40px';
            
            container.onclick = function(){
                centerMapOnFleet();
            };
            
            return container;
        },
        onRemove: function(map) {}
    });
    
    new CenterControl({position: 'topright'}).addTo(map);
}

// Load and display truck markers
function loadTruckMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markerClusterGroup.clearLayers();
    truckMarkers = {};
    routeLines = {};
    
    ENHANCED_TRUCK_DATA.forEach(truck => {
        createTruckMarker(truck);
        if (truck.pickupPoints && truck.pickupPoints.length > 0) {
            createRouteForTruck(truck);
        }
    });
    
    // Update fleet statistics
    updateFleetStatistics();
}

// Create individual truck marker with enhanced popup
function createTruckMarker(truck) {
    if (!map) return;
    
    // Determine marker icon based on status
    const iconHtml = getTruckIcon(truck.status);
    
    const customIcon = L.divIcon({
        html: iconHtml,
        className: `truck-marker truck-${truck.status}`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
    
    // Create marker
    const marker = L.marker([truck.lat, truck.lng], {
        icon: customIcon,
        title: `Truck ${truck.id} - ${truck.driver}`
    });
    
    // Create enhanced popup content
    const popupContent = createTruckPopupContent(truck);
    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'truck-popup'
    });
    
    // Add to cluster group
    markerClusterGroup.addLayer(marker);
    
    // Store reference
    truckMarkers[truck.id] = marker;
    
    // Add rotation if truck is moving
    if (truck.speed > 0) {
        rotateTruckMarker(marker, truck.bearing);
    }
}

// Function to rotate truck marker (NEWLY ADDED)
function rotateTruckMarker(marker, bearing) {
    const iconElement = marker.getElement();
    if (iconElement) {
        iconElement.style.transform = `rotate(${bearing}deg)`;
    }
}

// Get truck icon HTML based on status
function getTruckIcon(status) {
    const icons = {
        active: '🚛',
        idle: '🟡',
        completed: '✅',
        maintenance: '🔧'
    };
    
    return `<div class="truck-icon">${icons[status] || '🚛'}</div>`;
}

// Create enhanced popup content for trucks
function createTruckPopupContent(truck) {
    const fuelColor = truck.fuel > 50 ? 'green' : truck.fuel > 25 ? 'orange' : 'red';
    const speedColor = truck.speed > 0 ? 'green' : 'gray';
    
    return `
        <div class="truck-popup-content">
            <div class="popup-header">
                <h4>🚛 Truck #${truck.id}</h4>
                <span class="status-badge status-${truck.status}">${truck.status.toUpperCase()}</span>
            </div>
            
            <div class="popup-info">
                <div class="info-row">
                    <span class="info-label">👤 Driver:</span>
                    <span class="info-value">${truck.driver}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📍 Location:</span>
                    <span class="info-value">${truck.location}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🛣️ Route:</span>
                    <span class="info-value">${truck.route}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">📈 Progress:</span>
                    <span class="info-value">${truck.progress}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">⏰ ETA:</span>
                    <span class="info-value">${truck.eta}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">⛽ Fuel:</span>
                    <span class="info-value" style="color: ${fuelColor}">${truck.fuel}%</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🏃 Speed:</span>
                    <span class="info-value" style="color: ${speedColor}">${truck.speed} km/h</span>
                </div>
                <div class="info-row">
                    <span class="info-label">🕐 Last Update:</span>
                    <span class="info-value">${truck.lastUpdate.toLocaleTimeString()}</span>
                </div>
            </div>
            
            <div class="popup-actions">
                <button class="btn-small btn-info" onclick="showTruckDetails('${truck.id}')">
                    📊 Details
                </button>
                <button class="btn-small btn-success" onclick="trackTruck('${truck.id}')">
                    🎯 Track
                </button>
                <button class="btn-small btn-warning" onclick="contactDriver('${truck.id}')">
                    📞 Contact
                </button>
            </div>
        </div>
    `;
}

// Create route visualization for trucks
function createRouteForTruck(truck) {
    if (!truck.pickupPoints || truck.pickupPoints.length === 0) return;
    
    const routeCoords = [[truck.lat, truck.lng]];
    
    // Add pickup points to route
    truck.pickupPoints.forEach(point => {
        routeCoords.push([point.lat, point.lng]);
        
        // Create pickup point marker
        const pickupIcon = L.divIcon({
            html: getPickupPointIcon(point.status),
            className: `pickup-marker pickup-${point.status}`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const pickupMarker = L.marker([point.lat, point.lng], {
            icon: pickupIcon,
            title: point.address
        });
        
        pickupMarker.bindPopup(`
            <div class="pickup-popup">
                <h5>📍 Pickup Point</h5>
                <p><strong>Address:</strong> ${point.address}</p>
                <p><strong>Status:</strong> <span class="status-${point.status}">${point.status}</span></p>
            </div>
        `);
        
        markerClusterGroup.addLayer(pickupMarker);
    });
    
    // Create route line
    const routeLine = L.polyline(routeCoords, {
        color: getRouteColor(truck.status),
        weight: 4,
        opacity: 0.7,
        dashArray: truck.status === 'completed' ? '10, 10' : null
    });
    
    map.addLayer(routeLine);
    routeLines[truck.id] = routeLine;
}

// Get pickup point icon based on status
function getPickupPointIcon(status) {
    const icons = {
        completed: '✅',
        current: '🔄',
        pending: '📍'
    };
    
    return icons[status] || '📍';
}

// Get route color based on truck status
function getRouteColor(status) {
    const colors = {
        active: '#28a745',
        idle: '#ffc107',
        completed: '#6c757d',
        maintenance: '#dc3545'
    };
    
    return colors[status] || '#007bff';
}

// Add depot/base markers (Calapan City)
function addDepotMarkers() {
    const depots = [
        {
            name: 'Main EcoWais Depot',
            lat: 13.4145,
            lng: 121.1805,
            address: 'Barangay Suqui, Calapan City'
        },
        {
            name: 'Northern Collection Base',
            lat: 13.4208,
            lng: 121.1830,
            address: 'Barangay San Vicente, Calapan City'
        },
        {
            name: 'Southern Waste Facility',
            lat: 13.3998,
            lng: 121.1775,
            address: 'Barangay Guinobatan, Calapan City'
        }
    ];

    depots.forEach(depot => {
        const depotIcon = L.divIcon({
            html: '🏢',
            className: 'depot-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const depotMarker = L.marker([depot.lat, depot.lng], {
            icon: depotIcon,
            title: depot.name
        });

        depotMarker.bindPopup(`
            <div class="depot-popup">
                <h4>🏢 ${depot.name}</h4>
                <p>${depot.address}</p>
                <button class="btn-small btn-info" onclick="showDepotInfo('${depot.name}', '${depot.address}')">
                    ℹ️ Info
                </button>
            </div>
        `);

        map.addLayer(depotMarker);
    });
}

// Show depot information (NEWLY ADDED)
function showDepotInfo(name, address) {
    showModal(`
        <h3>🏢 ${name}</h3>
        <p><strong>Address:</strong> ${address}</p>
        <p>This is a primary waste collection and sorting facility.</p>
        <p><strong>Capacity:</strong> 500 tons/day</p>
        <p><strong>Operating Hours:</strong> 24/7</p>
    `);
}

// ==============================================
// TRACKING CONTROLS AND INTERACTIONS
// ==============================================

// Toggle auto-refresh functionality
function toggleAutoRefresh() {
    isAutoRefreshEnabled = !isAutoRefreshEnabled;
    
    const statusEl = document.getElementById('refresh-status');
    if (statusEl) {
        statusEl.textContent = `🔄 Auto Refresh: ${isAutoRefreshEnabled ? 'ON' : 'OFF'}`;
    }
    
    if (isAutoRefreshEnabled) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

// Start auto-refresh with selected interval
function startAutoRefresh() {
    stopAutoRefresh(); // Clear existing interval
    
    const intervalSelect = document.getElementById('update-interval');
    const interval = intervalSelect ? parseInt(intervalSelect.value) : 10000;
    
    autoRefreshInterval = setInterval(() => {
        if (isAutoRefreshEnabled) {
            refreshTruckData();
        }
    }, interval);
    
    console.log(`🔄 Auto-refresh started with ${interval/1000}s interval`);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Change update interval
function changeUpdateInterval() {
    if (isAutoRefreshEnabled) {
        startAutoRefresh(); // Restart with new interval
    }
}

// Refresh truck data (simulate API call)
function refreshTruckData() {
    console.log('🔄 Refreshing truck data...');
    
    // Simulate slight movement and data changes
    ENHANCED_TRUCK_DATA.forEach(truck => {
        if (truck.status === 'active') {
            // Simulate small GPS movements
            truck.lat += (Math.random() - 0.5) * 0.0005; // Smaller movements
            truck.lng += (Math.random() - 0.5) * 0.0005;
            
            // Update fuel (decrease slightly)
            if (truck.fuel > 5) { // Ensure fuel doesn't go below 5%
                truck.fuel = Math.max(5, truck.fuel - Math.random() * 0.5); // Slower fuel decrease
            } else {
                truck.status = 'maintenance'; // Simulate running out of fuel
            }
            
            // Update speed (more realistic fluctuations)
            truck.speed = Math.max(0, Math.min(60, truck.speed + (Math.random() - 0.5) * 5)); // Speed between 0-60 km/h
            
            // Update bearing based on movement direction (simple approximation)
            const prevMarker = truckMarkers[truck.id];
            if (prevMarker) {
                const prevLatLng = prevMarker.getLatLng();
                const newLatLng = L.latLng(truck.lat, truck.lng);
                truck.bearing = L.latLng(prevLatLng).bearingTo(newLatLng);
            }

            // Simulate progress
            if (truck.progress.includes('/')) {
                let [completed, total] = truck.progress.split('/').map(Number);
                if (completed < total) {
                    if (Math.random() < 0.1) { // 10% chance to complete a stop
                        completed++;
                        truck.progress = `${completed}/${total} stops`;
                        if (completed === total) {
                            truck.status = 'completed';
                            truck.eta = 'Completed';
                            truck.speed = 0;
                        }
                    }
                }
            }
            
            // Update last update time
            truck.lastUpdate = new Date();
        } else if (truck.status === 'idle') {
            // Idle trucks might start moving
            if (Math.random() < 0.05) { // 5% chance to become active
                truck.status = 'active';
                truck.speed = 10;
            }
        } else if (truck.status === 'completed') {
            // Completed trucks might return to base or go to maintenance
            if (Math.random() < 0.02) { // 2% chance to go to maintenance
                truck.status = 'maintenance';
            }
        }
    });
    
    // Refresh markers
    loadTruckMarkers();
    
    // Update table
    updateTruckStatusTable();
}

// Center map on fleet
function centerMapOnFleet() {
    if (!map || ENHANCED_TRUCK_DATA.length === 0) return;
    
    const group = new L.featureGroup(Object.values(truckMarkers));
    map.fitBounds(group.getBounds().pad(0.1));
    
    console.log('🎯 Map centered on fleet');
}

// Change map view (satellite, street, terrain)
function changeMapView() {
    const viewMode = document.getElementById('view-mode')?.value || 'street';
    
    // Remove existing tile layers
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer && layer !== trafficLayer) { // Don't remove traffic layer if it exists
            map.removeLayer(layer);
        }
    });
    
    // Add new tile layer
    const tileConfig = TILE_LAYERS[viewMode];
    L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 18
    }).addTo(map);
    
    console.log(`🗺️ Map view changed to: ${viewMode}`);
}

// Filter trucks based on status
function filterTrucks() {
    const filterValue = document.getElementById('truck-filter')?.value || 'all';
    
    // Clear existing markers
    markerClusterGroup.clearLayers();
    
    // Filter and display trucks
    const filteredTrucks = filterValue === 'all' 
        ? ENHANCED_TRUCK_DATA 
        : ENHANCED_TRUCK_DATA.filter(truck => truck.status === filterValue);
    
    filteredTrucks.forEach(truck => {
        if (truckMarkers[truck.id]) {
            markerClusterGroup.addLayer(truckMarkers[truck.id]);
        }
    });
    
    updateFleetStatistics(filteredTrucks);
    
    console.log(`🔍 Filtered trucks: ${filterValue} (${filteredTrucks.length} trucks)`);
}

// Search trucks by ID or driver name
function searchTrucks() {
    const searchTerm = document.getElementById('truck-search')?.value.toLowerCase() || '';
    const tableBody = document.getElementById('truck-status-table');
    
    if (!tableBody) return;
    
    const rows = tableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Toggle traffic layer (IMPROVED IMPLEMENTATION)
function toggleTrafficLayer() {
    if (trafficLayer) {
        map.removeLayer(trafficLayer);
        trafficLayer = null;
        console.log('🚦 Traffic layer disabled');
    } else {
        // Using a free OpenStreetMap-based traffic layer if available, or a placeholder
        // Note: Real-time traffic data usually requires an API key and a paid service.
        // This is a simplified example using a common tile provider that might offer traffic.
        // For a robust solution, integrate with services like HERE, Mapbox, or Google Maps Platform.
        
        // Example using OpenTraffic (if available and compatible) - this is often not real-time
        // trafficLayer = L.tileLayer('https://{s}.tile.opentraffic.io/tiles/traffic/{z}/{x}/{y}.png', {
        //     maxZoom: 18,
        //     attribution: '© OpenTraffic contributors'
        // }).addTo(map);

        // For demonstration, we'll use a simple colored overlay or a more generic warning
        alert('🚦 Real-time traffic data integration requires a dedicated traffic API (e.g., HERE, Mapbox, Google Maps Traffic). This feature is a placeholder.');
        console.log('🚦 Traffic layer would be enabled here (requires traffic API)');
    }
}

// ==============================================
// TRUCK INTERACTION FUNCTIONS
// ==============================================

// Show detailed truck information (IMPROVED WITH MODAL)
function showTruckDetails(truckId) {
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck) return;
    
    const detailsHtml = `
        <div class="truck-details-modal-content">
            <h3>🚛 Truck #${truck.id} - Detailed Information</h3>
            
            <div class="details-grid">
                <div class="detail-section">
                    <h4>📊 Current Status</h4>
                    <p><strong>Driver:</strong> ${truck.driver}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${truck.status}">${truck.status.toUpperCase()}</span></p>
                    <p><strong>Location:</strong> ${truck.location}</p>
                    <p><strong>Coordinates:</strong> ${truck.lat.toFixed(4)}, ${truck.lng.toFixed(4)}</p>
                    <p><strong>Speed:</strong> ${truck.speed} km/h</p>
                    <p><strong>Bearing:</strong> ${truck.bearing}°</p>
                </div>
                
                <div class="detail-section">
                    <h4>⛽ Vehicle Information</h4>
                    <p><strong>Fuel Level:</strong> ${truck.fuel}%</p>
                    <p><strong>Route:</strong> ${truck.route}</p>
                    <p><strong>Progress:</strong> ${truck.progress}</p>
                    <p><strong>ETA:</strong> ${truck.eta}</p>
                    <p><strong>Last Update:</strong> ${truck.lastUpdate.toLocaleString()}</p>
                </div>
            </div>
            
            <div class="pickup-points-section">
                <h4>📍 Pickup Points</h4>
                ${truck.pickupPoints.length > 0 ? truck.pickupPoints.map(point => `
                    <div class="pickup-point-item">
                        <span class="pickup-status status-${point.status}">${point.status}</span>
                        <span>${point.address}</span>
                    </div>
                `).join('') : '<p>No pickup points assigned.</p>'}
            </div>
            
            <div class="modal-actions">
                <button class="btn btn-info" onclick="trackTruck('${truck.id}'); closeModal();">🎯 Track on Map</button>
                <button class="btn btn-success" onclick="contactDriver('${truck.id}'); closeModal();">📞 Contact Driver</button>
            </div>
        </div>
    `;
    
    showModal(detailsHtml);
}

// Track specific truck (center map on truck)
function trackTruck(truckId) {
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck || !map) return;
    
    // Center map on truck
    map.setView([truck.lat, truck.lng], 15);
    
    // Open truck popup
    if (truckMarkers[truck.id]) {
        truckMarkers[truck.id].openPopup();
    }
    
    console.log(`🎯 Tracking truck #${truckId}`);
}

// Contact driver (placeholder)
function contactDriver(truckId) {
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck) return;
    
    alert(`📞 Contacting ${truck.driver} (Truck #${truckId})\n\nThis would open communication options:\n- Call driver\n- Send message\n- Emergency alert`);
}

// Update fleet statistics
function updateFleetStatistics(trucksData = ENHANCED_TRUCK_DATA) {
    const activeCount = trucksData.filter(t => t.status === 'active').length;
    const idleCount = trucksData.filter(t => t.status === 'idle').length;
    const totalDistance = trucksData.reduce((sum, truck) => sum + (truck.speed * 8), 0); // Approximate daily distance
    
    const activeCountEl = document.getElementById('active-count');
    const idleCountEl = document.getElementById('idle-count');
    const totalDistanceEl = document.getElementById('total-distance');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (idleCountEl) idleCountEl.textContent = idleCount;
    if (totalDistanceEl) totalDistanceEl.textContent = `${totalDistance.toFixed(1)} km`;
}

// Update truck status table
function updateTruckStatusTable() {
    const tableBody = document.getElementById('truck-status-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    ENHANCED_TRUCK_DATA.forEach(truck => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="truck-id">
                    ${getTruckIcon(truck.status)} #${truck.id}
                </div>
            </td>
            <td>${truck.driver}</td>
            <td>
                <div class="location-cell">
                    📍 ${truck.location}
                    <small>${truck.lat.toFixed(4)}, ${truck.lng.toFixed(4)}</small>
                </div>
            </td>
            <td>${truck.route}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${getProgressPercentage(truck.progress)}%"></div>
                    <span class="progress-text">${truck.progress}</span>
                </div>
            </td>
            <td>${truck.eta}</td>
            <td>
                <div class="fuel-indicator">
                    <div class="fuel-bar">
                        <div class="fuel-fill" style="width: ${truck.fuel}%; background-color: ${getFuelColor(truck.fuel)}"></div>
                    </div>
                    <span>${truck.fuel.toFixed(1)}%</span>
                </div>
            </td>
            <td>
                <span class="status-badge status-${truck.status}">
                    ${truck.status.toUpperCase()}
                </span>
                <small>🏃 ${truck.speed.toFixed(1)} km/h</small>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-info" onclick="showTruckDetails('${truck.id}')" title="Details">📊</button>
                    <button class="btn-small btn-success" onclick="trackTruck('${truck.id}')" title="Track">🎯</button>
                    <button class="btn-small btn-warning" onclick="contactDriver('${truck.id}')" title="Contact">📞</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Helper function to get progress percentage
function getProgressPercentage(progressString) {
    const match = progressString.match(/(\d+)\/(\d+)/);
    if (match) {
        return (parseInt(match[1]) / parseInt(match[2])) * 100;
    }
    return 0;
}

// Helper function to get fuel color
function getFuelColor(fuel) {
    if (fuel > 50) return '#28a745';
    if (fuel > 25) return '#ffc107';
    return '#dc3545';
}

// ==============================================
// ROUTE PLANNING FUNCTIONS
// ==============================================

// Optimize route for selected truck
function optimizeRoute() {
    const truckId = document.getElementById('route-truck-select')?.value;
    if (!truckId) {
        alert('Please select a truck first');
        return;
    }
    
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck) return;
    
    showModal(`
        <h3>🔄 Optimizing Route for Truck #${truckId}</h3>
        <p><strong>Driver:</strong> ${truck.driver}</p>
        <p>Route optimization would perform the following:</p>
        <ul>
            <li>Calculate the shortest and most efficient path.</li>
            <li>Consider real-time traffic conditions (if integrated).</li>
            <li>Minimize fuel consumption and operational costs.</li>
            <li>Optimize the sequence of pickup points.</li>
        </ul>
        <p><strong>Estimated Time Savings:</strong> 15-20 minutes per route.</p>
        <p><strong>Status:</strong> Optimization in progress... (Simulated)</p>
        <div class="loading" style="margin: 1rem auto;"></div>
        <p style="text-align: center; margin-top: 1rem;">This process typically takes a few seconds.</p>
    `);
    
    console.log(`🔄 Route optimized for truck #${truckId}`);
}

// Show route details
function showRouteDetails() {
    const truckId = document.getElementById('route-truck-select')?.value;
    if (!truckId) {
        alert('Please select a truck first');
        return;
    }
    
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck) return;
    
    let pickupPointsHtml = '';
    if (truck.pickupPoints && truck.pickupPoints.length > 0) {
        pickupPointsHtml = `
            <h4>📍 Pickup Points:</h4>
            <ul>
                ${truck.pickupPoints.map((point, index) => `
                    <li>${index + 1}. ${point.address} - <span class="status-${point.status}">${point.status}</span></li>
                `).join('')}
            </ul>
        `;
    } else {
        pickupPointsHtml = '<p>No pickup points assigned for this truck.</p>';
    }

    showModal(`
        <h3>🗺️ Route Details for Truck #${truckId}</h3>
        <p><strong>Driver:</strong> ${truck.driver}</p>
        <p><strong>Current Route:</strong> ${truck.route}</p>
        <p><strong>Progress:</strong> ${truck.progress}</p>
        <p><strong>Estimated Time of Arrival (ETA):</strong> ${truck.eta}</p>
        ${pickupPointsHtml}
        <p>This route is dynamically updated based on real-time conditions.</p>
    `);
}

// Assign new route to truck
function assignNewRoute() {
    const truckId = document.getElementById('route-truck-select')?.value;
    if (!truckId) {
        alert('Please select a truck first');
        return;
    }
    
    showModal(`
        <h3>📍 Assign New Route to Truck #${truckId}</h3>
        <p>This interface would allow you to:</p>
        <ul>
            <li>Select new pickup locations from a map or list.</li>
            <li>Set priorities for each collection point.</li>
            <li>Define time windows for pickups.</li>
            <li>Calculate and preview the optimal route sequence.</li>
            <li>Dispatch the new route directly to the driver's device.</li>
        </ul>
        <p><strong>Note:</strong> This is a simulated feature. In a real system, this would involve complex GIS and logistics algorithms.</p>
    `);
}

// Export fleet data
function exportFleetData() {
    const csvData = [
        ['Truck ID', 'Driver', 'Status', 'Location', 'Route', 'Progress', 'Fuel %', 'Speed', 'ETA', 'Last Update']
    ];
    
    ENHANCED_TRUCK_DATA.forEach(truck => {
        csvData.push([
            truck.id,
            truck.driver,
            truck.status,
            truck.location,
            truck.route,
            truck.progress,
            truck.fuel.toFixed(1),
            truck.speed.toFixed(1),
            truck.eta,
            truck.lastUpdate.toISOString()
        ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `fleet_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('📊 Fleet data exported to CSV');
}

// ==============================================
// MODAL SYSTEM (NEWLY ADDED)
// ==============================================

function showModal(contentHtml) {
    let modal = document.getElementById('app-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'app-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title"></h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body" id="modal-body-content"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners for the new modal
        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    const modalBody = modal.querySelector('#modal-body-content');
    modalBody.innerHTML = contentHtml;
    // Attempt to extract title from contentHtml or set a default
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    const firstHeading = tempDiv.querySelector('h3, h4');
    const modalTitle = modal.querySelector('#modal-title');
    if (firstHeading && modalTitle) {
        modalTitle.textContent = firstHeading.textContent;
        firstHeading.remove(); // Remove it from the body content if it was extracted
    } else if (modalTitle) {
        modalTitle.textContent = 'Information'; // Default title
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
}

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = ''; // Restore scrolling
}


// ==============================================
// ORIGINAL FUNCTIONS (MODIFIED FOR COMPATIBILITY)
// ==============================================

// Show login page and hide navigation
function showLoginPage() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('login-page').classList.add('active');

    // Hide navigation when not logged in
    const navLinks = document.querySelector('.navbar .nav-links');
    if (navLinks) navLinks.style.display = 'none';
}

// Enhanced show page function with tracking initialization
function showPage(pageId) {
    // Check if user has access to this page
    if (!hasPageAccess(pageId)) {
        alert('Access denied. You do not have permission to view this page.');
        return;
    }

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(`${pageId}-page`).classList.add('active');

    document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navButton = document.getElementById(`nav-${pageId}`);
    if (navButton && navButton.style.display !== 'none') {
        navButton.classList.add('active');
    }

    // Initialize tracking map when tracking page is shown
    if (pageId === 'tracking') {
        setTimeout(() => {
            initializeTrackingMap();
            updateTruckStatusTable();
            populateRouteTruckSelect();
        }, 100);
    } else {
        // Stop auto-refresh and clear map if navigating away from tracking page
        stopAutoRefresh();
        if (map) {
            map.remove();
            map = null;
        }
    }
    
    // Load specific page data
    if (pageId === 'admin') {
        loadAdminData();
        updateAdminStats();
    }
}

// Populate truck select dropdown for route planning
function populateRouteTruckSelect() {
    const select = document.getElementById('route-truck-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choose a truck...</option>';
    
    ENHANCED_TRUCK_DATA.forEach(truck => {
        const option = document.createElement('option');
        option.value = truck.id;
        option.textContent = `Truck #${truck.id} - ${truck.driver} (${truck.status})`;
        select.appendChild(option);
    });
}

// Check if user has permission to access a page
function hasPageAccess(pageId) {
    if (!currentUser || !userType) return false;
    const permissions = rolePermissions[userType];
    return permissions && permissions.pages.includes(pageId);
}

// Check if user has permission for a specific feature
function hasFeatureAccess(feature) {
    if (!currentUser || !userType) return false;
    const permissions = rolePermissions[userType];
    return permissions && (permissions.features.includes('all') || permissions.features.includes(feature));
}

// Handle login with role-based access
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    userType = document.getElementById('user-type').value;

    if (!userType) {
        alert('Please select a user type');
        return;
    }

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    // Simple authentication (for demonstration purposes)
    // In a real application, this would involve backend authentication
    const validCredentials = {
        'resident': { email: 'barangay@example.com', password: 'password' },
        'driver': { email: 'driver@example.com', password: 'password' },
        'admin': { email: 'admin@example.com', password: 'password' }
    };

    if (validCredentials[userType] && 
        email === validCredentials[userType].email && 
        password === validCredentials[userType].password) {
        
        currentUser = {
            email: email,
            type: userType,
            name: email.split('@')[0]
        };

        const userName = document.getElementById('user-name');
        const userInfo = document.getElementById('user-info');
        
        if (userName) userName.textContent = currentUser.name;
        if (userInfo) userInfo.style.display = 'flex';
        
        document.getElementById('login-page').classList.remove('active');

        // Update navigation based on user role
        updateNavigationForUser();

        // Redirect to appropriate page based on user type
        switch (userType) {
            case 'resident':
                showPage('resident');
                loadResidentPickups();
                break;
            case 'driver':
                showPage('driver');
                const driverNameEl = document.getElementById('driver-name');
                if (driverNameEl) driverNameEl.textContent = `Driver ${currentUser.name}`;
                loadDriverRoutes();
                break;
            case 'admin':
                showPage('dashboard');
                loadAdminData();
                updateAdminStats();
                break;
            default:
                showPage('dashboard');
        }
    } else {
        alert('Invalid credentials or user type. Please try again.');
    }
}

// Update navigation based on user role
function updateNavigationForUser() {
    const navLinks = document.querySelector('.navbar .nav-links');
    if (navLinks) navLinks.style.display = 'flex';

    // Hide/show navigation buttons based on role
    const navButtons = {
        'nav-dashboard': 'dashboard',
        'nav-resident': 'resident',
        'nav-driver': 'driver',
        'nav-admin': 'admin',
        'nav-tracking': 'tracking'
    };

    Object.entries(navButtons).forEach(([buttonId, pageId]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            if (hasPageAccess(pageId)) {
                button.style.display = 'inline-block';
            } else {
                button.style.display = 'none';
            }
        }
    });
}

// Logout function
function logout() {
    currentUser = null;
    userType = null;
    
    const userInfo = document.getElementById('user-info');
    if (userInfo) userInfo.style.display = 'none';
    
    // Stop auto-refresh when logging out
    stopAutoRefresh();
    
    // Clear map
    if (map) {
        map.remove();
        map = null;
    }
    
    showLoginPage();
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
}

// ==============================================
// SAMPLE DATA AND UTILITY FUNCTIONS
// ==============================================

// Sample data for resident pickups

const samplePickups = [
    { id: 1, date: '2025-08-15', time: 'morning', type: 'general', status: 'pending', truck: 'Truck #7' },
    { id: 2, date: '2025-08-16', time: 'afternoon', type: 'recyclable', status: 'pending', truck: 'Truck #3' }
];

// Sample data for driver routes (Calapan City)
const sampleDriverRoutes = [
    { id: 1, time: '8:00 AM', address: 'Barangay Suqui, Calapan City', type: 'general', status: 'completed' },
    { id: 2, time: '8:30 AM', address: 'Barangay Lalud, Calapan City', type: 'recyclable', status: 'current' },
    { id: 3, time: '9:00 AM', address: 'Barangay Guinobatan, Calapan City', type: 'organic', status: 'pending' }
];

// Load sample data for dashboard (Calapan City)
function loadSampleData() {
    const activityLog = [
        { time: '10:30 AM', activity: 'Truck #5 completed route', location: 'Barangay Suqui, Calapan City', status: 'completed' },
        { time: '10:15 AM', activity: 'New pickup scheduled', location: 'Barangay Lalud, Calapan City', status: 'pending' },
        { time: '09:45 AM', activity: 'Truck #3 started route', location: 'Barangay Guinobatan, Calapan City', status: 'in-progress' }
    ];


    const activityLogTable = document.getElementById('activity-log');
    if (activityLogTable) {
        activityLogTable.innerHTML = '';
        activityLog.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.time}</td>
                <td>${item.activity}</td>
                <td>${item.location}</td>
                <td><span class="status status-${item.status}">${formatStatus(item.status)}</span></td>
            `;
            activityLogTable.appendChild(row);
        });
    }
}

// Format status for display
function formatStatus(status) {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// RESIDENT FUNCTIONS
function loadResidentPickups() {
    if (!hasFeatureAccess('view-pickups')) {
        console.log('Access denied to view pickups');
        return;
    }

    const table = document.getElementById('resident-pickups');
    if (!table) return;

    table.innerHTML = '';

    samplePickups.forEach(pickup => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pickup.date}</td>
            <td>${pickup.time}</td>
            <td>${pickup.type}</td>
            <td><span class="status status-${pickup.status}">${formatStatus(pickup.status)}</span></td>
            <td>${pickup.truck}</td>
            <td><button class="btn btn-warning" onclick="cancelPickup(${pickup.id})">Cancel</button></td>
        `;
        table.appendChild(row);
    });
}

function schedulePickup(e) {
    e.preventDefault();

    if (!hasFeatureAccess('schedule-pickup')) {
        alert('Access denied. You do not have permission to schedule pickups.');
        return;
    }

    const address = document.getElementById('pickup-address').value;
    const type = document.getElementById('waste-type').value;
    const date = document.getElementById('pickup-date').value;
    const time = document.getElementById('pickup-time').value;

    const newPickup = {
        id: samplePickups.length + 1,
        date: date,
        time: time,
        type: type,
        status: 'pending',
        truck: `Truck #${Math.floor(Math.random() * 10) + 1}`
    };

    samplePickups.push(newPickup);
    loadResidentPickups();
    alert('Pickup scheduled successfully!');
    e.target.reset();
}

function cancelPickup(id) {
    if (!hasFeatureAccess('schedule-pickup')) {
        alert('Access denied. You do not have permission to cancel pickups.');
        return;
    }

    const index = samplePickups.findIndex(p => p.id === id);
    if (index !== -1) {
        samplePickups.splice(index, 1);
        loadResidentPickups();
        alert('Pickup cancelled successfully');
    }
}

function submitReport(e) {
    e.preventDefault();

    if (!hasFeatureAccess('report-issues')) {
        alert('Access denied. You do not have permission to submit reports.');
        return;
    }

    const type = document.getElementById('issue-type').value;
    const location = document.getElementById('issue-location').value;
    const description = document.getElementById('issue-description').value;

    alert('Issue reported successfully!');
    e.target.reset();
}

// DRIVER FUNCTIONS
function loadDriverRoutes() {
    if (!hasFeatureAccess('view-routes')) {
        console.log('Access denied to view routes');
        return;
    }

    const table = document.getElementById('driver-routes');
    if (!table) return;

    table.innerHTML = '';

    sampleDriverRoutes.forEach(route => {
        const row = document.createElement('tr');

        let actionCell;
        if (route.status === 'completed') {
            actionCell = '<td>✓</td>';
        } else if (route.status === 'current') {
            actionCell = '<td><button class="btn btn-success" onclick="completePickup(' + route.id + ')">Mark Complete</button></td>';
        } else {
            actionCell = '<td>-</td>';
        }

        row.innerHTML = `
            <td>${route.time}</td>
            <td>${route.address}</td>
            <td>${route.type}</td>
            <td><span class="status status-${route.status}">${formatStatus(route.status)}</span></td>
            ${actionCell}
        `;
        table.appendChild(row);
    });
}

function completePickup(id) {
    if (!hasFeatureAccess('update-status')) {
        alert('Access denied. You do not have permission to update pickup status.');
        return;
    }

    const route = sampleDriverRoutes.find(r => r.id === id);
    if (route) {
        route.status = 'completed';
        loadDriverRoutes();
    }
}

function updateLocation() {
    if (!hasFeatureAccess('update-status')) {
        alert('Access denied. You do not have permission to update location.');
        return;
    }

    const location = document.getElementById('driver-location').value;
    if (location) {
        alert(`Location updated to: ${location}`);
    } else {
        alert('Please enter a location');
    }
}

function updateDriverStatus() {
    if (!hasFeatureAccess('update-status')) {
        alert('Access denied. You do not have permission to update status.');
        return;
    }

    const status = document.getElementById('driver-status-select').value;
    alert(`Status updated to: ${formatStatus(status)}`);
}

// ADMIN FUNCTIONS (Placeholder - implement as needed)
function loadAdminData() {
    if (userType !== 'admin') {
        console.log('Access denied to admin data');
        return;
    }
    console.log('Loading admin data...');
    // Example: Populate fleet table with ENHANCED_TRUCK_DATA
    const fleetTableBody = document.getElementById('fleet-table');
    if (fleetTableBody) {
        fleetTableBody.innerHTML = '';
        ENHANCED_TRUCK_DATA.forEach(truck => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${truck.id}</td>
                <td>${truck.driver}</td>
                <td>${truck.location}</td>
                <td><span class="status status-${truck.status}">${formatStatus(truck.status)}</span></td>
                <td>${truck.fuel.toFixed(1)}%</td>
                <td>
                    <button class="btn-small btn-info" onclick="showTruckDetails('${truck.id}')">View</button>
                    <button class="btn-small btn-warning" onclick="editTruck('${truck.id}')">Edit</button>
                </td>
            `;
            fleetTableBody.appendChild(row);
        });
    }

    // Example: Populate admin reports (dummy data)
    const adminReportsTable = document.getElementById('admin-reports');
    if (adminReportsTable) {
        adminReportsTable.innerHTML = '';
       const dummyReports = [
    { 
        time: '2025-08-10 14:00', 
        reporter: 'Resident A', 
        type: 'Missed Collection', 
        location: 'Barangay Suqui, Calapan City', 
        priority: 'High', 
        status: 'New' 
    },
    { 
        time: '2025-08-09 10:30', 
        reporter: 'Driver B', 
        type: 'Vehicle Problem', 
        location: 'Barangay San Vicente, Calapan City', 
        priority: 'Medium', 
        status: 'In Review' 
    },
    { 
        time: '2025-08-08 16:45', 
        reporter: 'Resident C', 
        type: 'Illegal Dumping', 
        location: 'Barangay Lalud, Calapan City', 
        priority: 'High', 
        status: 'New' 
    },
    { 
        time: '2025-08-07 09:15', 
        reporter: 'Resident D', 
        type: 'Waste Spillage', 
        location: 'Barangay Guinobatan, Calapan City', 
        priority: 'Low', 
        status: 'Resolved' 
    }
];

        dummyReports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.time}</td>
                <td>${report.reporter}</td>
                <td>${report.type}</td>
                <td>${report.location}</td>
                <td><span class="status status-${report.priority.toLowerCase()}">${report.priority}</span></td>
                <td><span class="status status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></td>
                <td>
                    <button class="btn-small btn-info" onclick="viewReportDetails(${JSON.stringify(report).replace(/"/g, '&quot;')})">View</button>
                    <button class="btn-small btn-success" onclick="resolveReport(${JSON.stringify(report).replace(/"/g, '&quot;')})">Resolve</button>
                </td>
            `;
            adminReportsTable.appendChild(row);
        });
    }
}

function updateAdminStats() {
    if (userType !== 'admin') return;
    console.log('Updating admin stats...');
    // Update dashboard stats with more dynamic data if available
    document.getElementById('active-trucks').textContent = ENHANCED_TRUCK_DATA.filter(t => t.status === 'active').length;
    document.getElementById('scheduled-pickups').textContent = samplePickups.length + sampleDriverRoutes.length; // Combined
    document.getElementById('completion-rate').textContent = '95%'; // Placeholder
    document.getElementById('reports-count').textContent = '3'; // Based on dummy reports
}

// Admin specific functions (NEWLY ADDED or IMPROVED)
function addNewTruck() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can add new trucks.');
        return;
    }
    showModal(`
        <h3>➕ Add New Truck</h3>
        <form id="add-truck-form">
            <div class="form-group">
                <label for="new-truck-id">Truck ID</label>
                <input type="text" id="new-truck-id" required>
            </div>
            <div class="form-group">
                <label for="new-truck-driver">Driver Name</label>
                <input type="text" id="new-truck-driver" required>
            </div>
            <div class="form-group">
                <label for="new-truck-location">Initial Location</label>
                <input type="text" id="new-truck-location" required>
            </div>
            <div class="form-group">
                <label for="new-truck-fuel">Initial Fuel (%)</label>
                <input type="number" id="new-truck-fuel" min="0" max="100" value="100" required>
            </div>
            <button type="submit" class="btn btn-success btn-full">Add Truck</button>
        </form>
    `);
    document.getElementById('add-truck-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('new-truck-id').value;
        const driver = document.getElementById('new-truck-driver').value;
        const location = document.getElementById('new-truck-location').value;
        const fuel = parseInt(document.getElementById('new-truck-fuel').value);

        // Simple validation
        if (ENHANCED_TRUCK_DATA.some(t => t.id === id)) {
            alert('Truck ID already exists!');
            return;
        }

        const newTruck = {
            id: id,
            driver: driver,
            location: location,
            lat: MAP_CONFIG.center[0] + (Math.random() - 0.5) * 0.1, // Randomize near center
            lng: MAP_CONFIG.center[1] + (Math.random() - 0.5) * 0.1,
            route: 'Unassigned',
            progress: '0/0 stops',
            eta: 'N/A',
            status: 'idle',
            fuel: fuel,
            speed: 0,
            bearing: 0,
            lastUpdate: new Date(),
            pickupPoints: []
        };
        ENHANCED_TRUCK_DATA.push(newTruck);
        loadAdminData(); // Refresh admin table
        loadTruckMarkers(); // Refresh map markers
        populateRouteTruckSelect(); // Update route planning dropdown
        alert(`Truck #${id} added successfully!`);
        closeModal();
    });
}

function editTruck(truckId) {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can edit trucks.');
        return;
    }
    const truck = ENHANCED_TRUCK_DATA.find(t => t.id === truckId);
    if (!truck) return;

    showModal(`
        <h3>✏️ Edit Truck #${truck.id}</h3>
        <form id="edit-truck-form">
            <div class="form-group">
                <label for="edit-truck-driver">Driver Name</label>
                <input type="text" id="edit-truck-driver" value="${truck.driver}" required>
            </div>
            <div class="form-group">
                <label for="edit-truck-location">Current Location</label>
                <input type="text" id="edit-truck-location" value="${truck.location}" required>
            </div>
            <div class="form-group">
                <label for="edit-truck-status">Status</label>
                <select id="edit-truck-status" required>
                    <option value="active" ${truck.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="idle" ${truck.status === 'idle' ? 'selected' : ''}>Idle</option>
                    <option value="completed" ${truck.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="maintenance" ${truck.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-truck-fuel">Fuel (%)</label>
                <input type="number" id="edit-truck-fuel" min="0" max="100" value="${truck.fuel.toFixed(0)}" required>
            </div>
            <button type="submit" class="btn btn-success btn-full">Save Changes</button>
        </form>
    `);
    document.getElementById('edit-truck-form').addEventListener('submit', (e) => {
        e.preventDefault();
        truck.driver = document.getElementById('edit-truck-driver').value;
        truck.location = document.getElementById('edit-truck-location').value;
        truck.status = document.getElementById('edit-truck-status').value;
        truck.fuel = parseInt(document.getElementById('edit-truck-fuel').value);
        
        loadAdminData(); // Refresh admin table
        loadTruckMarkers(); // Refresh map markers
        updateTruckStatusTable(); // Refresh tracking table
        alert(`Truck #${truck.id} updated successfully!`);
        closeModal();
    });
}

function viewReportDetails(report) {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can view report details.');
        return;
    }
    showModal(`
        <h3>📋 Report Details - ${report.type}</h3>
        <p><strong>Time:</strong> ${report.time}</p>
        <p><strong>Reporter:</strong> ${report.reporter}</p>
        <p><strong>Location:</strong> ${report.location}</p>
        <p><strong>Priority:</strong> <span class="status status-${report.priority.toLowerCase()}">${report.priority}</span></p>
        <p><strong>Status:</strong> <span class="status status-${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span></p>
        <p><strong>Description:</strong> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <div class="modal-actions">
            <button class="btn btn-success" onclick="resolveReport(${JSON.stringify(report).replace(/"/g, '&quot;')}); closeModal();">Resolve Report</button>
            <button class="btn btn-warning" onclick="assignReport(${JSON.stringify(report).replace(/"/g, '&quot;')}); closeModal();">Assign</button>
        </div>
    `);
}

function resolveReport(report) {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can resolve reports.');
        return;
    }
    alert(`Report from ${report.reporter} (${report.type}) at ${report.location} marked as RESOLVED.`);
    // In a real app, update the report status in your data source
    loadAdminData(); // Refresh table
}

function assignReport(report) {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can assign reports.');
        return;
    }
    alert(`Report from ${report.reporter} (${report.type}) at ${report.location} assigned to a team.`);
    // In a real app, update the report status and assign it
    loadAdminData(); // Refresh table
}

function addNewDriver() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can add new drivers.');
        return;
    }
    showModal(`
        <h3>➕ Add New Driver</h3>
        <form id="add-driver-form">
            <div class="form-group">
                <label for="new-driver-name">Driver Name</label>
                <input type="text" id="new-driver-name" required>
            </div>
            <div class="form-group">
                <label for="new-driver-email">Email</label>
                <input type="email" id="new-driver-email" required>
            </div>
            <div class="form-group">
                <label for="new-driver-phone">Phone Number</label>
                <input type="tel" id="new-driver-phone">
            </div>
            <button type="submit" class="btn btn-success btn-full">Add Driver</button>
        </form>
    `);
    document.getElementById('add-driver-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-driver-name').value;
        const email = document.getElementById('new-driver-email').value;
        const phone = document.getElementById('new-driver-phone').value;
        alert(`Driver ${name} (${email}) added successfully! (Simulated)`);
        closeModal();
    });
}

function manageRoutes() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can manage routes.');
        return;
    }
    showModal(`
        <h3>🗺️ Route Management</h3>
        <p>This section provides tools for comprehensive route management:</p>
        <ul>
            <li><strong>View All Routes:</strong> See current and historical routes for all trucks.</li>
            <li><strong>Create New Routes:</strong> Design and assign new collection routes.</li>
            <li><strong>Edit Existing Routes:</strong> Modify pickup points, schedules, and truck assignments.</li>
            <li><strong>Route Optimization:</strong> Run algorithms to improve efficiency and reduce costs.</li>
            <li><strong>Route Analytics:</strong> Analyze route performance, completion rates, and deviations.</li>
        </ul>
        <p><strong>Note:</strong> This is a high-level overview. Actual implementation would involve detailed map interactions and data management.</p>
    `);
}

function systemMaintenance() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can access system maintenance.');
        return;
    }
    showModal(`
        <h3>⚙️ System Maintenance</h3>
        <p>This panel allows administrators to perform critical system operations:</p>
        <ul>
            <li><strong>Database Backup/Restore:</strong> Ensure data integrity and recovery.</li>
            <li><strong>Log Management:</strong> Review system logs for errors and performance.</li>
            <li><strong>User Session Management:</strong> Monitor and manage active user sessions.</li>
            <li><strong>System Updates:</strong> Apply software updates and patches.</li>
            <li><strong>Performance Monitoring:</strong> Check server and application performance metrics.</li>
        </ul>
        <p><strong>Warning:</strong> Operations in this section should be performed with caution.</p>
    `);
}

function generateReports() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can generate reports.');
        return;
    }
    showModal(`
        <h3>📊 Generate Reports</h3>
        <p>Select the type of report you wish to generate:</p>
        <ul>
            <li><strong>Fleet Performance Report:</strong> Truck utilization, fuel efficiency, distance covered.</li>
            <li><strong>Collection Efficiency Report:</strong> Pickup completion rates, missed collections, average time per stop.</li>
            <li><strong>Resident Issue Report:</strong> Analysis of reported issues by type, location, and resolution time.</li>
            <li><strong>Environmental Impact Report:</strong> Estimated CO2 emissions, waste diversion rates.</li>
            <li><strong>Financial Report:</strong> Operational costs, revenue (if applicable).</li>
        </ul>
        <p>Reports can be exported in various formats (CSV, PDF).</p>
    `);
}

function backupData() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can backup data.');
        return;
    }
    showModal(`
        <h3>💾 Data Backup</h3>
        <p>Initiate a full or incremental backup of the EcoWais system database and files.</p>
        <p><strong>Last Backup:</strong> 2025-08-10 03:00 AM</p>
        <p><strong>Next Scheduled Backup:</strong> 2025-08-11 03:00 AM</p>
        <button class="btn btn-warning" onclick="alert('Backup process initiated! (Simulated)'); closeModal();">Perform Manual Backup Now</button>
        <p style="margin-top: 1rem;">Regular backups are crucial for data recovery and business continuity.</p>
    `);
}

function userManagement() {
    if (userType !== 'admin') {
        alert('Access denied. Only administrators can manage users.');
        return;
    }
    showModal(`
        <h3>👥 User Management</h3>
        <p>Manage user accounts and roles within the EcoWais system:</p>
        <ul>
            <li><strong>View All Users:</strong> List of residents, drivers, and administrators.</li>
            <li><strong>Add New User:</strong> Create new accounts with specific roles.</li>
            <li><strong>Edit User Profiles:</strong> Update contact information, passwords, and permissions.</li>
            <li><strong>Deactivate/Activate Users:</strong> Control access to the system.</li>
            <li><strong>Role Assignment:</strong> Modify user roles and their associated permissions.</li>
        </ul>
        <p>This ensures secure and controlled access to the system's functionalities.</p>
    `);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced EcoWais System Starting...');
    loadSampleData();
    console.log('✅ Enhanced EcoWais System Ready');
});
