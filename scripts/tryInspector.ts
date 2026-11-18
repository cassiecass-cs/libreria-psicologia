
export class TryInspector{


	static async verify(fun:Function):Promise<boolean>{

		try{

			await fun();
			return true;

		}catch(error){

			console.log(error);
			return false;

		}

	}

}