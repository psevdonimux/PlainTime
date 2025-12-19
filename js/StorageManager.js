export default class StorageManager{

	storage(key, value = undefined){
		if(value === undefined){
			return localStorage.getItem(key);
		}
		if(value === null){
			localStorage.removeItem(key);
		}
		else{
			localStorage.setItem(key, value);
		}
	}

	storageJSON(key, value = undefined){
		if(value === undefined){
			return JSON.parse(this.storage(key) || '{}');
		}
		this.storage(key, JSON.stringify(value));
	}

}