export default class TimeManager{
	constructor(storageManager, panelManager, subtaskManager){
		this.storageManager = storageManager;
		this.panelManager = panelManager;
		this.subtaskManager = subtaskManager;
		this.modalTime = document.getElementById('modal-time');
		this.modalEditTime = document.getElementById('modal-edit-time');
		this.pendingTask = null;
		this.editingTimeTask = null;
		this.onTaskCreated = null;
	}

	init(onTaskCreated){
		this.onTaskCreated = onTaskCreated;
		this.initTimeModalEvents();
		this.initEditTimeModalEvents();
	}

	initTimeModalEvents(){
		document.getElementById('time-apply').onclick = () => {
			const start = document.getElementById('time-start').value;
			const end = document.getElementById('time-end').value;
			if(this.pendingTask && this.onTaskCreated){
				this.onTaskCreated(
					this.pendingTask.day,
					this.pendingTask.column,
					this.pendingTask.text,
					start || null,
					end || null,
					this.pendingTask.parentPath || null
				);
				this.pendingTask = null;
			}
			this.modalTime.close();
			document.getElementById('time-start').value = '';
			document.getElementById('time-end').value = '';
		};
		document.getElementById('time-skip').onclick = () => {
			if(this.pendingTask && this.onTaskCreated){
				this.onTaskCreated(
					this.pendingTask.day,
					this.pendingTask.column,
					this.pendingTask.text,
					null,
					null,
					this.pendingTask.parentPath || null
				);
				this.pendingTask = null;
			}
			this.modalTime.close();
			document.getElementById('time-start').value = '';
			document.getElementById('time-end').value = '';
		};
	}

	initEditTimeModalEvents(){
		document.getElementById('edit-time-apply').onclick = () => {
			if(this.editingTimeTask){
				const start = document.getElementById('edit-time-start').value;
				const end = document.getElementById('edit-time-end').value;
				let days = this.storageManager.storageJSON('days');
				let currentDay = this.panelManager.getCurrentTaskDay();
				const task = this.subtaskManager.getTaskByPath(days[currentDay][this.editingTimeTask.column], this.editingTimeTask.path);
				if(task && start && end){
					task.timeStart = start;
					task.timeEnd = end;
					this.storageManager.storageJSON('days', days);
					if(this.onUpdate) this.onUpdate();
				}
				this.editingTimeTask = null;
			}
			this.modalEditTime.close();
		};
		document.getElementById('edit-time-delete').onclick = () => {
			if(this.editingTimeTask){
				let days = this.storageManager.storageJSON('days');
				let currentDay = this.panelManager.getCurrentTaskDay();
				const task = this.subtaskManager.getTaskByPath(days[currentDay][this.editingTimeTask.column], this.editingTimeTask.path);
				if(task){
					delete task.timeStart;
					delete task.timeEnd;
					this.storageManager.storageJSON('days', days);
					if(this.onUpdate) this.onUpdate();
				}
				this.editingTimeTask = null;
			}
			this.modalEditTime.close();
		};
		document.getElementById('edit-time-cancel').onclick = () => {
			this.editingTimeTask = null;
			this.modalEditTime.close();
		};
	}

	openTimeModal(){
		this.modalTime.showModal();
	}

	openEditTimeModal(columnIndex, taskPath){
		let days = this.storageManager.storageJSON('days');
		let currentDay = this.panelManager.getCurrentTaskDay();
		const task = this.subtaskManager.getTaskByPath(days[currentDay][columnIndex], taskPath);
		if(task){
			this.editingTimeTask = {column: columnIndex, path: taskPath};
			document.getElementById('edit-time-start').value = task.timeStart || '';
			document.getElementById('edit-time-end').value = task.timeEnd || '';
			this.modalEditTime.showModal();
		}
	}

	setPendingTask(task){
		this.pendingTask = task;
	}

	setOnUpdate(callback){
		this.onUpdate = callback;
	}
}
