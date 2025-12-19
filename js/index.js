import StorageManager from '/js/StorageManager.js';
import ThemeManager from '/js/ThemeManager.js';
import TaskManager from '/js/TaskManager.js';
import PanelManager from '/js/PanelManager.js';

class App{

	constructor(){
		this.elements = this.getElements();
		this.storageManager = new StorageManager();
		this.themeManager = new ThemeManager(document.documentElement.dataset, this.storageManager, this.elements);
		this.panelManager = new PanelManager(this.storageManager, (day) => this.taskManager.updateAllTaskLists(day));
		this.taskManager = new TaskManager(this.storageManager, this.panelManager);
		this.themeManager.updateTheme();
		this.bindEvents();
	}

	getElements(){
		const ids = ['mode', 'random', 'close', 'modalSettings', 'settings',
			'delete', 'optionsMenu', 'mode', 'fileInput', 'import', 'export', 'import'
		];
		return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
	}

	bindEvents(){
		this.taskManager.updateAllTaskLists();
		this.taskManager.initDragAndDrop();
		let addTaskElements = document.getElementsByClassName('add-task');
		let checkboxElements = document.getElementsByClassName('checkbox');
		let inputTaskElements = document.getElementsByClassName('input-task');
		for(let i = 0; i < addTaskElements.length; i++){
			let column = i;
			addTaskElements[i].onclick = () => {
				this.taskManager.createTask(this.panelManager.getCurrentTaskDay(), column, document.getElementsByClassName('input-task')[i].value);
				document.getElementsByClassName('input-task')[i].value = '';
			};
		}
		for(let i = 0; i < checkboxElements.length; i++){
			let column = i;
			checkboxElements[i].onclick = (e) => {
				const taskLabel = e.target.closest('.task-label');
				const columnIndex = parseInt(taskLabel.dataset.columnIndex);
				const taskIndex = parseInt(taskLabel.dataset.taskIndex);
				this.taskManager.updateTaskStatus(columnIndex, taskIndex);
			};
		}
		for(let i = 0; i < inputTaskElements.length; i++){
			let column = i;
			inputTaskElements[i].onchange = () => {
				this.taskManager.createTask(this.panelManager.getCurrentTaskDay(), column, document.getElementsByClassName('input-task')[i].value);
				document.getElementsByClassName('input-task')[i].value = '';
			};
		}
		document.onclick = (e) => {
			const taskLabel = e.target.closest('.task-label');
			const columnIndex = taskLabel ? parseInt(taskLabel.dataset.columnIndex) : null;
			const taskIndex = taskLabel ? parseInt(taskLabel.dataset.taskIndex) : null;
			if(e.target.classList.contains('close')){				
				this.taskManager.deleteTask(this.panelManager.getCurrentTaskDay(), columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('checkbox')){				
				this.taskManager.updateTaskStatus(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('edit')){
				this.taskManager.editTask(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('days')){
				this.panelManager.updateDays(e);
			}
		};
		this.elements.mode.onclick = () => {
			this.themeManager.toggleTheme();
			this.themeManager.updateTheme();
		};	
		this.elements.export.onclick = () => this.panelManager.handleExport();
		this.elements.import.onclick = () => this.elements.fileInput.click();
		this.elements.fileInput.onchange = (e) => this.panelManager.handleImport(e);
	}	
}
new App();
