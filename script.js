// URL del script de backend (ej. un archivo PHP) que manejará los folios y guardará los datos
const BACKEND_URL = '/api/generar-orden.php'; // <--- ¡CAMBIAR POR TU RUTA REAL!

// 1. FUNCIONALIDAD DE EXPORTACIÓN Y ENVÍO A BACKEND

/**
 * Recolecta todos los datos del formulario.
 * @returns {Object} Objeto con todos los valores del formulario.
 */
function gatherData(){
    const form = document.getElementById('catastroForm');
    const data = {};
    const elements = form.querySelectorAll('input, select, textarea');
    elements.forEach(element => {
        if (element.id) {
            data[element.id] = element.value;
        }
    });
    return data;
}

/**
 * Simula el envío de datos al servidor para obtener el Folio y el QR.
 * @param {Object} data - Datos del formulario.
 */
async function sendToBackend(data){
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = 'Enviando...';

    try {
        // *** ESTA ES LA PARTE QUE DEBES REEMPLAZAR CON TU LÓGICA REAL DE FETCH EN UN SERVIDOR ***
        // fetch(BACKEND_URL, {
        //     method: 'POST',
        //     headers: {'Content-Type': 'application/json'},
        //     body: JSON.stringify(data)
        // });
        // const response = await response.json();

        // SIMULACIÓN DE RESPUESTA DEL SERVIDOR
        await new Promise(resolve => setTimeout(resolve, 1500)); // Espera 1.5s
        
        // El servidor devuelve el Folio generado y la URL del QR
        const serverResponse = {
            success: true,
            folio: 'CATA-' + Math.floor(Math.random() * 10000) + new Date().getFullYear(), // Folio único simulado
            qrImageUrl: 'https://via.placeholder.com/100x100?text=' + data.clave.replace(/-/g, '')
        };

        if (serverResponse.success) {
            // 1. Actualiza el folio
            document.getElementById('folio').value = serverResponse.folio;
            
            // 2. Muestra el QR devuelto
            qrContainer.innerHTML = '';
            const qrImage = document.createElement('img');
            qrImage.src = serverResponse.qrImageUrl;
            qrImage.alt = 'Código QR de la Orden';
            qrImage.style.width = '100%';
            qrImage.style.height = '100%';
            qrContainer.appendChild(qrImage);
            
            alert(`¡Orden guardada! Folio asignado: ${serverResponse.folio}`);
        } else {
            throw new Error('Error en el servidor al generar el folio.');
        }

    } catch(error) {
        qrContainer.innerHTML = 'Error de conexión o servidor.';
        console.error('Error al enviar datos:', error);
        alert('Hubo un error al generar el folio. Intenta de nuevo.');
    }
}

// Manejar el submit del formulario (Generar Folio y QR)
document.getElementById('catastroForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Evita el envío tradicional
    const data = gatherData();
    // Validación básica
    if (!data.clave || !data.lat || !data.lon || !data.nombre) {
        alert('Por favor, completa los campos requeridos (Nombre, Clave Catastral, Latitud y Longitud).');
        return;
    }
    sendToBackend(data);
});

// Exportar CSV (función local)
document.getElementById('exportCsv').addEventListener('click', () => {
    const data = gatherData();
    const keys = Object.keys(data);
    const escapeCsv = val => '"' + String(val || '').replace(/"/g, '""').replace(/\n/g, ' ') + '"';
    
    const header = keys.join(',');
    const values = keys.map(k => escapeCsv(data[k]));
    
    const csv = header + "\n" + values.join(',');
    
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'Orden_Trabajo_' + data.clave + '.csv'; 
    a.click();
    URL.revokeObjectURL(url);
});

// 2. LÓGICA DE MAPA Y FECHA

// Establece la fecha actual automáticamente
document.getElementById('fecha').value = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });

// Inicialización y lógica del mapa
const map = L.map('map').setView([19.29, -98.98], 13); // Coordenada central predeterminada
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '©️ OSM' }).addTo(map);
let marker = null;

function setCoords(lat, lon){
    document.getElementById('lat').value = parseFloat(lat).toFixed(6);
    document.getElementById('lon').value = parseFloat(lon).toFixed(6);
}

function placeMarker(lat, lon){
    if(marker) { map.removeLayer(marker); }
    marker = L.marker([lat, lon], {draggable:true}).addTo(map);
    marker.on('dragend', e => {
        const p = e.target.getLatLng();
        setCoords(p.lat, p.lng);
    });
    setCoords(lat, lon);
    map.setView([lat, lon], 17);
}

map.on('click', function(e){ placeMarker(e.latlng.lat, e.latlng.lng); });

document.getElementById('useLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            placeMarker(pos.coords.latitude, pos.coords.longitude);
        }, err => alert('No se pudo obtener la ubicación: ' + (err.message || err.code)));
    } else alert('Geolocalización no disponible.');
});

document.getElementById('clearMarker').addEventListener('click', () => {
    if(marker){ map.removeLayer(marker); marker = null; }
    document.getElementById('lat').value = '';
    document.getElementById('lon').value = '';
});

function updateMarkerFromInputs(){
    const la = parseFloat(document.getElementById('lat').value);
    const lo = parseFloat(document.getElementById('lon').value);
    if(!isNaN(la) && !isNaN(lo) && la>=-90 && la<=90 && lo>=-180 && lo<=180){
        placeMarker(la, lo);
    }
}
document.getElementById('lat').addEventListener('change', updateMarkerFromInputs);
document.getElementById('lon').addEventListener('change', updateMarkerFromInputs);
