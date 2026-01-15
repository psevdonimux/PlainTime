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
		const theme = this.storageManager.storage('theme') || 'dark';
		this.themedata.theme = theme;
		this.elements.mode.textContent = theme === 'dark' ? 'Тёмная' : 'Светлая';
	}
}
