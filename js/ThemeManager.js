export default class ThemeManager{

	constructor(theme, storageManager, elements){
		this.theme = theme;
		this.storageManager = storageManager;
		this.elements = elements;
		this.themedata = document.documentElement.dataset;
	}

	toggleTheme(){
		const theme = this.storageManager.storage('theme') === 'light' ? 'dark' : 'light';
		this.themedata.theme = theme;
		this.storageManager.storage('theme', theme);
	}

	updateTheme(){
		const currentTheme = this.storageManager.storage('theme') || 'dark'; // значение по умолчанию
		this.themedata.theme = currentTheme;
		this.elements.mode.textContent = currentTheme == 'dark' ? 'Тёмная' : 'Светлая';
	}

}