export class Requests {
    url;
    constructor(url) {
        this.url = url;
    }
    changeURL(url) {
        this.url = url;
    }
    async getJSON() {
        try {
            // 1. Hacemos la petición HTTP con fetch
            const response = await fetch(this.url);
            // 2. Verificamos si la respuesta fue exitosa (status 200-299)
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            // 3. Convertimos la respuesta a un objeto JSON
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Fallo en la petición GET: ${error.message}`);
            }
            throw new Error("Ocurrió un error desconocido al obtener el JSON");
        }
    }
}
