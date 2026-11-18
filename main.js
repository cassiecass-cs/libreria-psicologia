import { Requests } from "./scripts/request.js";
// Clase dedicada exclusivamente a la persistencia en LocalStorage
class DBNavegador {
    dbKey = "DB_CASS_PISCOLOGIA";
    guardar(datos) {
        try {
            const serializado = JSON.stringify(datos);
            localStorage.setItem(this.dbKey, serializado);
        }
        catch (error) {
            console.error("Error al guardar en localStorage:", error);
        }
    }
    cargar() {
        try {
            const raw = localStorage.getItem(this.dbKey);
            return raw ? JSON.parse(raw) : {};
        }
        catch (error) {
            console.error("Error al leer desde localStorage:", error);
            return {};
        }
    }
    limpiar() {
        localStorage.removeItem(this.dbKey);
    }
}
class GestorLibros {
    libros;
    favoritos;
    request;
    db;
    constructor() {
        this.libros = {};
        this.db = new DBNavegador();
        // Al iniciar la app, recupera automáticamente los favoritos guardados en el navegador
        this.favoritos = this.db.cargar();
        this.request = new Requests("https://openlibrary.org/search.json?q=subject:psicologia&language=spa&sort=new&limit=100");
    }
    async cargarLibrosDesdeAPI() {
        try {
            const data = await this.request.getJSON();
            if (data && data.docs) {
                data.docs.forEach((item) => {
                    const esReadable = item.has_fulltext === true;
                    const esLendable = item.availability?.available_to_borrow || false;
                    let textoDisponibilidad = "Consulta en biblioteca";
                    if (esReadable) {
                        textoDisponibilidad = "Libro abierto al público (Lectura online)";
                    }
                    else if (esLendable) {
                        textoDisponibilidad = "Disponible para préstamo";
                    }
                    const portada = item.cover_i
                        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
                        : "https://via.placeholder.com/150?text=Sin+Portada";
                    const autorNombre = item.author_name?.[0] || "Autor desconocido";
                    const workKey = item.key || "";
                    const nuevoLibro = {
                        id: workKey,
                        nombre: item.title || "Título desconocido",
                        autor: autorNombre,
                        portada: portada,
                        disponibilidad: textoDisponibilidad,
                        esLendable: esLendable,
                        esReadable: esReadable,
                        urlLectura: `https://openlibrary.org${workKey}`,
                        page: 0
                    };
                    this.agregarLibro(nuevoLibro);
                });
            }
        }
        catch (error) {
            console.error("Error al cargar los libros:", error);
        }
    }
    agregarLibro(libro) {
        this.libros[libro.id] = libro;
    }
    agregarFavoritos(libro) {
        this.favoritos[libro.id] = { ...libro };
        this.db.guardar(this.favoritos); // Sincroniza con DB_CASS_PISCOLOGIA
    }
    eliminarFavorito(id) {
        delete this.favoritos[id];
        this.db.guardar(this.favoritos); // Sincroniza con DB_CASS_PISCOLOGIA
    }
    guardarProgreso(id, page) {
        if (this.favoritos[id]) {
            this.favoritos[id].page = page;
            this.db.guardar(this.favoritos); // Guarda la página en localStorage
        }
        if (this.libros[id]) {
            this.libros[id].page = page;
        }
    }
    esFavorito(id) {
        return Boolean(this.favoritos[id]);
    }
    obtenerLibros() {
        return Object.values(this.libros);
    }
    obtenerFavoritos() {
        return Object.values(this.favoritos);
    }
}
class VistaApp {
    gestor;
    cajaLibreria;
    cajaFavoritos;
    cajaInformacion;
    ulLibreria;
    ulFavoritos;
    constructor(gestor) {
        this.gestor = gestor;
        this.cajaLibreria = document.getElementById("caja-list-view");
        this.cajaFavoritos = document.getElementById("caja-favoritos");
        this.cajaInformacion = document.getElementById("caja-informacion");
        this.ulLibreria = this.cajaLibreria?.querySelector(".list-view");
        this.ulFavoritos = this.cajaFavoritos?.querySelector(".list-view-favoritos");
    }
    // Controla qué sección se muestra y oculta las otras dos
    mostrarVista(vistaActiva) {
        if (this.cajaLibreria)
            this.cajaLibreria.style.display = "none";
        if (this.cajaFavoritos)
            this.cajaFavoritos.style.display = "none";
        if (this.cajaInformacion)
            this.cajaInformacion.style.display = "none";
        if (vistaActiva === 'libreria' && this.cajaLibreria) {
            this.cajaLibreria.style.display = "block";
            this.cajaLibreria.focus();
        }
        else if (vistaActiva === 'favoritos' && this.cajaFavoritos) {
            this.cajaFavoritos.style.display = "block";
            this.cajaFavoritos.focus();
            this.renderizarFavoritos();
        }
        else if (vistaActiva === 'informacion' && this.cajaInformacion) {
            this.cajaInformacion.style.display = "block";
            this.cajaInformacion.focus();
        }
    }
    async inicializarLibreria() {
        if (this.gestor.obtenerLibros().length === 0) {
            this.ulLibreria.innerHTML = `<li class="list-item"><p style="text-align: center; padding: 20px;">Cargando novedades en español...</p></li>`;
            await this.gestor.cargarLibrosDesdeAPI();
        }
        this.renderizarLibreria();
    }
    renderizarLibreria() {
        this.ulLibreria.innerHTML = "";
        const libros = this.gestor.obtenerLibros();
        libros.forEach((libro) => {
            const li = document.createElement("li");
            li.className = "list-item";
            const textoBotonAccion = libro.esReadable ? "Leer online" : (libro.esLendable ? "Pedir prestado" : "Ver ficha");
            const yaEsFavorito = this.gestor.esFavorito(libro.id);
            li.innerHTML = `
                <div class="list-item-header">
                    <img src="${libro.portada}" alt="${libro.nombre}" class="list-item-img">
                    <div class="list-item-info">
                        <h4 class="list-item-title">${libro.nombre}</h4>
                        <span class="list-item-subtitle">Autor: ${libro.autor}</span>
                    </div>
                </div>
                <div class="list-item-body">
                    <p><strong>Disponibilidad:</strong> ${libro.disponibilidad}</p>
                </div>
                <div class="list-item-actions">
                    <button class="list-btn list-btn-primary btn-leer">${textoBotonAccion}</button>
                    <button class="list-btn list-btn-accent btn-fav" ${yaEsFavorito ? "disabled" : ""}>
                        ${yaEsFavorito ? "En favoritos ✓" : "Añadir a Favoritos"}
                    </button>
                </div>
            `;
            li.querySelector(".btn-leer")?.addEventListener("click", () => {
                window.open(libro.urlLectura, "_blank");
            });
            const btnFav = li.querySelector(".btn-fav");
            btnFav?.addEventListener("click", () => {
                this.gestor.agregarFavoritos(libro);
                btnFav.textContent = "En favoritos ✓";
                btnFav.disabled = true;
            });
            this.ulLibreria.appendChild(li);
        });
    }
    renderizarFavoritos() {
        this.ulFavoritos.innerHTML = "";
        const favoritos = this.gestor.obtenerFavoritos();
        if (favoritos.length === 0) {
            this.ulFavoritos.innerHTML = `<li class="list-item"><p style="text-align: center; padding: 20px;">No tienes libros guardados en favoritos todavía.</p></li>`;
            return;
        }
        favoritos.forEach((libro) => {
            const li = document.createElement("li");
            li.className = "list-item";
            li.innerHTML = `
                <div class="list-item-header">
                    <img src="${libro.portada}" alt="${libro.nombre}" class="list-item-img">
                    <div class="list-item-info">
                        <h4 class="list-item-title">${libro.nombre}</h4>
                        <span class="list-item-subtitle">Autor: ${libro.autor}</span>
                    </div>
                </div>
                <div class="list-item-body" style="display: flex; flex-direction: column; gap: 10px;">
                    <p><strong>Progreso de lectura:</strong></p>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label>Página leída:</label>
                        <input type="number" class="input-pagina" value="${libro.page}" min="0" style="width: 80px; padding: 4px;">
                        <button class="list-btn list-btn-secondary btn-guardar-pagina" style="padding: 4px 10px;">Guardar</button>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="list-btn list-btn-primary btn-leer">Continuar leyendo</button>
                    <button class="list-btn list-btn-accent btn-eliminar" style="background-color: #ff4d4f; color: white;">Eliminar</button>
                </div>
            `;
            // Guardar página leída en DB_CASS_PISCOLOGIA
            const inputPagina = li.querySelector(".input-pagina");
            const btnGuardar = li.querySelector(".btn-guardar-pagina");
            btnGuardar?.addEventListener("click", () => {
                const nuevaPagina = parseInt(inputPagina.value) || 0;
                this.gestor.guardarProgreso(libro.id, nuevaPagina);
                btnGuardar.textContent = "Guardado ✓";
                setTimeout(() => {
                    btnGuardar.textContent = "Guardar";
                }, 1500);
            });
            // Abrir en Open Library
            li.querySelector(".btn-leer")?.addEventListener("click", () => {
                window.open(libro.urlLectura, "_blank");
            });
            // Eliminar de favoritos y actualizar localStorage
            li.querySelector(".btn-eliminar")?.addEventListener("click", () => {
                this.gestor.eliminarFavorito(libro.id);
                this.renderizarFavoritos();
                // Si la librería ya estaba cargada, actualiza el estado de sus botones
                if (this.gestor.obtenerLibros().length > 0) {
                    this.renderizarLibreria();
                }
            });
            this.ulFavoritos.appendChild(li);
        });
    }
}
// --- INICIALIZACIÓN DE LA APLICACIÓN ---
const gestor = new GestorLibros();
const vista = new VistaApp(gestor);
// Eventos del menú inferior
document.getElementById("nav-libreria")?.addEventListener("click", async () => {
    vista.mostrarVista('libreria');
    await vista.inicializarLibreria();
});
document.getElementById("nav-favoritos")?.addEventListener("click", () => {
    vista.mostrarVista('favoritos');
});
document.getElementById("nav-informacion")?.addEventListener("click", () => {
    vista.mostrarVista('informacion');
});
// Arrancar mostrando la librería por defecto al abrir la app
vista.mostrarVista('libreria');
vista.inicializarLibreria();
// --- REGISTRO DE SERVICE WORKER PARA PWA ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
            .catch((err) => console.error("Error al registrar el Service Worker:", err));
    });
}
