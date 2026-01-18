import StorageManager from '/js/StorageManager.js';
import ThemeManager from '/js/ThemeManager.js';
import TaskManager from '/js/TaskManager.js';
import PanelManager from '/js/PanelManager.js';
import SubtaskManager from '/js/SubtaskManager.js';
import TimeManager from '/js/TimeManager.js';
import StatisticsManager from '/js/StatisticsManager.js';
import WallpaperManager from '/js/WallpaperManager.js';

class App{
	constructor(){
		this.elements = this.getElements();
		this.storageManager = new StorageManager();
		this.themeManager = new ThemeManager(document.documentElement.dataset.theme, this.storageManager, this.elements);
		this.panelManager = new PanelManager(this.storageManager, (day) => this.taskManager.updateAllTaskLists(day));
		this.subtaskManager = new SubtaskManager(this.storageManager, this.panelManager);
		this.statisticsManager = new StatisticsManager(this.storageManager);
		this.timeManager = new TimeManager(this.storageManager, this.panelManager, this.subtaskManager);
		this.taskManager = new TaskManager(
			this.storageManager,
			this.panelManager,
			this.elements,
			this.themeManager,
			this.subtaskManager,
			this.timeManager,
			this.statisticsManager
		);
		this.wallpaperManager = new WallpaperManager(this.storageManager);
		this.themeManager.updateTheme();
		this.taskManager.bindEvents();
		this.wallpaperManager.init();
	}

	getElements(){
		const ids = ['mode', 'fileInput', 'import', 'export', 'reset-all-checks', 'delete-all-tasks', 'statistics'];
		return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
	}
}

new App();
