import StorageManager from '/js/StorageManager.js';
import ThemeManager from '/js/ThemeManager.js';
import TaskManager from '/js/TaskManager.js';
import PanelManager from '/js/PanelManager.js';

class App{

	constructor(){
		this.elements = this.getElements();
		this.storageManager = new StorageManager();
		this.themeManager = new ThemeManager(document.documentElement.dataset.theme, this.storageManager, this.elements);
		this.panelManager = new PanelManager(this.storageManager, (day) => this.taskManager.updateAllTaskLists(day));
		this.taskManager = new TaskManager(this.storageManager, this.panelManager, this.elements, this.themeManager);
		this.themeManager.updateTheme();
		this.taskManager.bindEvents();
	}

	getElements(){
		const ids = ['mode', 'fileInput', 'import', 'export'];
		return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
	}

}

new App();
