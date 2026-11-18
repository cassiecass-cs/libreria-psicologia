

/*Clase que genera tokens aleatorios*/
export class TokenGenerator{

	/*Metodo estatico para generar tokens  hexadecimales*/
	static createHexToken(length:number = 32){

		const buffer = new Uint8Array(length);

		crypto.getRandomValues(buffer);

		return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
	}

}