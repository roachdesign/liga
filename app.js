let datosExcel = [];

const ORDEN_CATEGORIAS = [
    'Primera', 'Segunda', 'Tercera', 'Cuarta', 
    'Quinta', 'Sexta', 'Séptima', 'Septima', 'Octava'
];

const COLUMNAS = {
    club: 'Club',
    categoria: 'Categoría',
    equipo: 'Equipo',
    nombreJugador: 'Nombre Jugador',
    ranking: 'Ranking',
    codigoTMT: 'Codigo TMT',
    linkPerfil: 'Link a su perfil',
    edad: 'edad',
    torneos: 'torneos',
    partidosGanados: 'partidos_ganados',
    porcentajeGanados: 'porcentaje_ganados',
    partidosTotales: 'Partidos Totales',
    ultimoTorneo: 'ultimo_torneo',
    primerPuesto: 'primer_puesto',
    segundoPuesto: 'segundo_puesto',
    tercerPuesto: 'tercer_puesto',
    podiosTotales: 'podios_totales',
    categoriaTMT: 'categoriatmt'
};

const URL_FOTOS = 'https://www.tenisdemesaparatodos.com/fotos/jugadores/';
let autoCargaIntentada = false;

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!autoCargaIntentada) {
            cargarDatos();
        }
    }, 500);
    
    document.getElementById('fileInput').addEventListener('change', handleFile);
});

async function cargarDatos() {
    if (autoCargaIntentada) return;
    autoCargaIntentada = true;
    
    mostrarLoading(true);
    
    // Intentar cargar JSON primero (más confiable en GitHub Pages)
    const rutasJSON = [
        'data/equipos.json',
        './data/equipos.json',
        'equipos.json',
        './equipos.json'
    ];
    
    for (const ruta of rutasJSON) {
        try {
            console.log('Intentando cargar JSON:', ruta);
            const response = await fetch(ruta, { cache: 'no-cache' });
            
            if (response.ok) {
                datosExcel = await response.json();
                console.log('JSON cargado:', datosExcel.length, 'registros');
                inicializarApp();
                document.querySelector('.upload-section').style.display = 'none';
                mostrarLoading(false); // <-- CORREGIDO: Ocultar loading
                return;
            }
        } catch (error) {
            console.log('No se pudo cargar JSON desde:', ruta);
        }
    }
    
    // Si no hay JSON, intentar Excel (para uso local)
    const rutasExcel = [
        'data/equipos.xlsx',
        './data/equipos.xlsx',
        'equipos.xlsx',
        './equipos.xlsx'
    ];
    
    for (const ruta of rutasExcel) {
        try {
            console.log('Intentando cargar Excel:', ruta);
            const response = await fetch(ruta, { cache: 'no-cache' });
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                if (arrayBuffer.byteLength > 0) {
                    procesarExcel(arrayBuffer);
                    document.querySelector('.upload-section').style.display = 'none';
                    return;
                }
            }
        } catch (error) {
            console.log('No se pudo cargar Excel desde:', ruta);
        }
    }
    
    console.log('No se encontró archivo automático');
    mostrarLoading(false);
    mostrarMensajeCargaManual();
}

function procesarExcel(data) {
    try {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        datosExcel = XLSX.utils.sheet_to_json(firstSheet);
        console.log('Excel procesado:', datosExcel.length, 'registros');
        inicializarApp();
        mostrarLoading(false); // <-- Esto estaba bien
    } catch (error) {
        console.error('Error al procesar Excel:', error);
        alert('Error al procesar el archivo: ' + error.message);
        mostrarLoading(false);
    }
}

function inicializarApp() {
    if (datosExcel.length > 0) {
        const columnasEncontradas = Object.keys(datosExcel[0]);
        const posibleCategoriaTMT = columnasEncontradas.find(col => 
            col.toLowerCase().includes('categoria') && col.toLowerCase().includes('tmt')
        );
        if (posibleCategoriaTMT && posibleCategoriaTMT !== COLUMNAS.categoriaTMT) {
            console.log('Columna categoría TMT encontrada como:', posibleCategoriaTMT);
            COLUMNAS.categoriaTMT = posibleCategoriaTMT;
        }
    }
    
    poblarSelect('categoria', obtenerUnicos('categoria'));
    document.getElementById('categoria').disabled = false;
    resetSelect('club');
    resetSelect('equipo');
    limpiarResultados();
}

function mostrarMensajeCargaManual() {
    const uploadSection = document.querySelector('.upload-section');
    uploadSection.innerHTML = `
        <div class="manual-upload">
            <span class="icon">📁</span>
            <p>Sube tu archivo Excel:</p>
            <label for="fileInput" class="file-label">
                Seleccionar archivo equipos.xlsx
            </label>
            <input type="file" id="fileInput" accept=".xlsx,.xls" />
        </div>
    `;
    document.getElementById('fileInput').addEventListener('change', handleFile);
}

function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    mostrarLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        procesarExcel(e.target.result);
        document.querySelector('.upload-section').style.display = 'none';
    };
    reader.onerror = () => {
        alert('Error al leer el archivo');
        mostrarLoading(false);
    };
    reader.readAsArrayBuffer(file);
}

function mostrarLoading(mostrar) {
    document.getElementById('loading').classList.toggle('hidden', !mostrar);
}

function obtenerUnicos(campo) {
    const valores = datosExcel
        .map(row => row[COLUMNAS[campo]])
        .filter(v => v !== undefined && v !== null && v !== '');
    
    const unicos = [...new Set(valores)];
    
    if (campo === 'categoria') {
        return unicos.sort((a, b) => {
            const indexA = ORDEN_CATEGORIAS.findIndex(cat => 
                cat.toLowerCase() === a.toLowerCase()
            );
            const indexB = ORDEN_CATEGORIAS.findIndex(cat => 
                cat.toLowerCase() === b.toLowerCase()
            );
            
            const posA = indexA === -1 ? 999 : indexA;
            const posB = indexB === -1 ? 999 : indexB;
            
            return posA - posB;
        });
    }
    
    return unicos.sort();
}

function poblarSelect(id, opciones) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Selecciona...</option>';
    
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion;
        select.appendChild(option);
    });
}

function resetSelect(id) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Selecciona...</option>';
    select.disabled = true;
}

function limpiarResultados() {
    document.getElementById('resultados').innerHTML = `
        <div class="empty-state">
            <span class="icon">🏓</span>
            <p>Selecciona los filtros para ver los jugadores</p>
        </div>
    `;
}

document.getElementById('categoria').addEventListener('change', (e) => {
    const categoria = e.target.value;
    
    resetSelect('club');
    resetSelect('equipo');
    limpiarResultados();
    
    if (!categoria) return;
    
    const clubs = [...new Set(
        datosExcel
            .filter(row => row[COLUMNAS.categoria] === categoria)
            .map(row => row[COLUMNAS.club])
    )].sort();
    
    poblarSelect('club', clubs);
    document.getElementById('club').disabled = false;
});

document.getElementById('club').addEventListener('change', (e) => {
    const categoria = document.getElementById('categoria').value;
    const club = e.target.value;
    
    resetSelect('equipo');
    limpiarResultados();
    
    if (!club) return;
    
    const equipos = [...new Set(
        datosExcel
            .filter(row => 
                row[COLUMNAS.categoria] === categoria && 
                row[COLUMNAS.club] === club
            )
            .map(row => row[COLUMNAS.equipo])
    )].sort();
    
    poblarSelect('equipo', equipos);
    document.getElementById('equipo').disabled = false;
});

document.getElementById('equipo').addEventListener('change', (e) => {
    const categoria = document.getElementById('categoria').value;
    const club = document.getElementById('club').value;
    const equipo = e.target.value;
    
    if (!equipo) {
        limpiarResultados();
        return;
    }
    
    const jugadores = datosExcel.filter(row => 
        row[COLUMNAS.categoria] === categoria && 
        row[COLUMNAS.club] === club &&
        row[COLUMNAS.equipo] === equipo
    );
    
    mostrarJugadores(jugadores, equipo, club, categoria);
});

function mostrarJugadores(jugadores, equipo, club, categoria) {
    const container = document.getElementById('resultados');
    
    if (jugadores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon">⚠️</span>
                <p>No se encontraron jugadores</p>
            </div>
        `;
        return;
    }
    
    const totalTorneos = jugadores.reduce((sum, j) => sum + (parseInt(j[COLUMNAS.torneos]) || 0), 0);
    const totalPodios = jugadores.reduce((sum, j) => sum + (parseInt(j[COLUMNAS.podiosTotales]) || 0), 0);
    
    let html = `
        <div class="equipo-header">
            <div class="equipo-info">
                <span class="categoria-tag">${categoria}</span>
                <h2>${equipo}</h2>
                <p class="club-name">${club}</p>
            </div>
            <div class="equipo-stats">
                <div class="stat-box">
                    <span class="stat-number">${jugadores.length}</span>
                    <span class="stat-label">Jugadores</span>
                </div>
                <div class="stat-box">
                    <span class="stat-number">${totalPodios}</span>
                    <span class="stat-label">Podios</span>
                </div>
            </div>
        </div>
        
        <div class="jugadores-grid">
    `;
    
    jugadores.forEach(jugador => {
        const codigo = jugador[COLUMNAS.codigoTMT] || '';
        const fotoUrl = codigo ? `${URL_FOTOS}${codigo}.jpg` : '';
        const linkPerfil = jugador[COLUMNAS.linkPerfil] || '#';
        const ranking = jugador[COLUMNAS.ranking] || '-';
        const edad = jugador[COLUMNAS.edad] || '-';
        const torneos = jugador[COLUMNAS.torneos] || '0';
        const partidosGanados = jugador[COLUMNAS.partidosGanados] || '0';
        const partidosTotales = jugador[COLUMNAS.partidosTotales] || '0';
        const porcentaje = jugador[COLUMNAS.porcentajeGanados] || '0%';
        const primerPuesto = jugador[COLUMNAS.primerPuesto] || '0';
        const segundoPuesto = jugador[COLUMNAS.segundoPuesto] || '0';
        const tercerPuesto = jugador[COLUMNAS.tercerPuesto] || '0';
        const podiosTotales = jugador[COLUMNAS.podiosTotales] || '0';
        const ultimoTorneo = jugador[COLUMNAS.ultimoTorneo] || '-';
        const categoriaTMT = jugador[COLUMNAS.categoriaTMT] || 'Sin categoría';
        
        html += `
            <div class="jugador-card">
                <div class="jugador-foto-container">
                    ${codigo ? 
                        `<img src="${fotoUrl}" 
                              alt="${jugador[COLUMNAS.nombreJugador]}" 
                              class="jugador-foto"
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                              onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                         <div class="sin-foto" style="display: none;">
                            <span>📷</span>
                            <p>Sin foto</p>
                         </div>` 
                        : 
                        `<div class="sin-foto">
                            <span>📷</span>
                            <p>Sin foto</p>
                         </div>`
                    }
                    <div class="ranking-badge">#${ranking}</div>
                </div>
                
                <div class="jugador-info">
                    <h3>${jugador[COLUMNAS.nombreJugador]}</h3>
                    
                    <div class="categoria-tmt-badge">
                        <span class="label-cat">Categoría TMT:</span>
                        <span class="valor-cat">${categoriaTMT}</span>
                    </div>
                    
                    <div class="stats-row">
                        <div class="stat">
                            <span class="stat-value">${edad}</span>
                            <span class="stat-label">años</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${torneos}</span>
                            <span class="stat-label">torneos</span>
                        </div>
                    </div>
                    
                    <div class="partidos-section">
                        <div class="partidos-header">
                            <span>Partidos</span>
                            <span class="porcentaje">${porcentaje}</span>
                        </div>
                        <div class="partidos-bar">
                            <div class="partidos-fill" style="width: ${porcentaje}"></div>
                        </div>
                        <div class="partidos-numbers">
                            <span>${partidosGanados} ganados</span>
                            <span>de ${partidosTotales}</span>
                        </div>
                    </div>
                    
                    <div class="podios-section">
                        <div class="podio-item podio-1">
                            <span class="medalla">🥇</span>
                            <span class="count">${primerPuesto}</span>
                        </div>
                        <div class="podio-item podio-2">
                            <span class="medalla">🥈</span>
                            <span class="count">${segundoPuesto}</span>
                        </div>
                        <div class="podio-item podio-3">
                            <span class="medalla">🥉</span>
                            <span class="count">${tercerPuesto}</span>
                        </div>
                        <div class="podio-total">
                            <span>Total: ${podiosTotales}</span>
                        </div>
                    </div>
                    
                    <div class="ultimo-torneo">
                        <span class="label">Último torneo:</span>
                        <span class="value">${ultimoTorneo}</span>
                    </div>
                    
                    ${linkPerfil !== '#' ? `
                        <a href="${linkPerfil}" target="_blank" class="btn-perfil">
                            Ver perfil TMT →
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}
