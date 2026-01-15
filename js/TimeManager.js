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
		const startInput = document.getElementById('time-start');
		const endInput = document.getElementById('time-end');
		const clearInputs = () => { startInput.value = ''; endInput.value = ''; };
		document.getElementById('time-apply').onclick = () => {
			if(this.pendingTask && this.onTaskCreated){
				this.onTaskCreated(this.pendingTask.day, this.pendingTask.column, this.pendingTask.text, startInput.value || null, endInput.value || null, this.pendingTask.parentPath || null);
				this.pendingTask = null;
			}
			this.modalTime.close();
			clearInputs();
		};
		document.getElementById('time-skip').onclick = () => {
			if(this.pendingTask && this.onTaskCreated){
				this.onTaskCreated(this.pendingTask.day, this.pendingTask.column, this.pendingTask.text, null, null, this.pendingTask.parentPath || null);
				this.pendingTask = null;
			}
			this.modalTime.close();
			clearInputs();
		};
	}
	initEditTimeModalEvents(){
		const startInput = document.getElementById('edit-time-start');
		const endInput = document.getElementById('edit-time-end');
		document.getElementById('edit-time-apply').onclick = () => {
			if(this.editingTimeTask){
				const days = this.storageManager.storageJSON('days');
				const task = this.subtaskManager.getTaskByPath(days[this.panelManager.getCurrentTaskDay()][this.editingTimeTask.column], this.editingTimeTask.path);
				if(task && startInput.value && endInput.value){
					task.timeStart = startInput.value;
					task.timeEnd = endInput.value;
					this.storageManager.storageJSON('days', days);
					this.onUpdate?.();
				}
				this.editingTimeTask = null;
			}
			this.modalEditTime.close();
		};
		document.getElementById('edit-time-delete').onclick = () => {
			if(this.editingTimeTask){
				const days = this.storageManager.storageJSON('days');
				const task = this.subtaskManager.getTaskByPath(days[this.panelManager.getCurrentTaskDay()][this.editingTimeTask.column], this.editingTimeTask.path);
				if(task){
					delete task.timeStart;
					delete task.timeEnd;
					this.storageManager.storageJSON('days', days);
					this.onUpdate?.();
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
		const days = this.storageManager.storageJSON('days');
		const task = this.subtaskManager.getTaskByPath(days[this.panelManager.getCurrentTaskDay()][columnIndex], taskPath);
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
