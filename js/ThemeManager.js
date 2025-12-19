export default class ThemeManager{

	constructor(theme, storageManager, elements){
		this.theme = theme;
		this.storageManager = storageManager;
		this.elements = elements;
	}

	toggleTheme(){
		const theme = this.storageManager.storage('theme') === 'light' ? 'dark' : 'light';
		this.dataset.theme = theme;
		this.storageManager.storage('theme', theme);
	}

	updateTheme(){
		if(this.storageManager.storage('theme') === 'light'){
			this.dataset.theme = 'light';
		}
		this.elements.mode.textContent = this.storageManager.storage('theme') === 'light' ? 'Светлая' : 'Тёмная';
	}

}