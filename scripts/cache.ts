
export class Cache{

	memory:Record<string,any>

	constructor(){
		this.memory = {}
	}

	save(key:string,value:any){

		const  today: Date = new Date();

		const onlyDate: string = today.toISOString().split('T')[0];

		const onlyHour: string = today.toTimeString().split(' ')[0];

		this.memory[key] = {"value":value,"date":onlyDate,"hour":onlyHour};
	}

	getAll(){
		return this.memory;
	}

	getValue(key:string){
		return this.memory[key];
	}

	delete(key:string){

		delete this.memory[key];

	}

}