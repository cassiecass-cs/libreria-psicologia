

/*Clase que hashea texto plano */
export class Hasher{

	encoder:TextEncoder;

	constructor(){
		this.encoder = new TextEncoder();
	}


	/*Función que hashea y devuelve un hash en hexa*/
	async encode(text:string,encriptation:string="SHA-256"){

		const data = this.encoder.encode(text);

		const hash = await crypto.subtle.digest(encriptation,data);

		return this.bufferToHex(hash);

	}

	/*Función que transforma el hash de array en una cadena hexa*/
	private bufferToHex(buffer: ArrayBuffer): string {
    
    	// Creamos una vista de bytes del buffer
    	const byteArray = new Uint8Array(buffer);
    
    	// Convertimos cada byte a hexadecimal de 2 dígitos y los unimos
    	const hexCodes = Array.from(byteArray).map(byte => {
      		return byte.toString(16).padStart(2, '0');
    	});

    	return hexCodes.join('');
  	}

}