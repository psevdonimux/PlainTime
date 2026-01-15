export default class SubtaskManager{
	constructor(storageManager, panelManager){
		this.storageManager = storageManager;
		this.panelManager = panelManager;
		this.collapsedTasks = new Set();
	}
	getTaskByPath(tasks, path){
		const indices = String(path).split('-').map(Number);
		let current = tasks[indices[0]];
		for(let i = 1; i < indices.length && current; i++){
			current = current.subtasks?.[indices[i]];
		}
		return current;
	}
	setTaskByPath(tasks, path, value){
		const indices = String(path).split('-').map(Number);
		if(indices.length === 1){
			value === null ? tasks.splice(indices[0], 1) : tasks[indices[0]] = value;
			return;
		}
		let current = tasks[indices[0]];
		for(let i = 1; i < indices.length - 1 && current; i++){
			current = current.subtasks?.[indices[i]];
		}
		if(current?.subtasks){
			const lastIdx = indices[indices.length - 1];
			value === null ? current.subtasks.splice(lastIdx, 1) : current.subtasks[lastIdx] = value;
		}
	}
	toggleSubtasks(path){
		this.collapsedTasks.has(path) ? this.collapsedTasks.delete(path) : this.collapsedTasks.add(path);
	}
	isCollapsed(path){
		return !this.collapsedTasks.has(path);
	}
	checkParentCompletion(tasks, path){
		const indices = String(path).split('-').map(Number);
		if(indices.length < 2) return;
		for(let depth = indices.length - 1; depth >= 1; depth--){
			const parent = this.getTaskByPath(tasks, indices.slice(0, depth).join('-'));
			if(parent?.subtasks?.length){
				parent.completed = parent.subtasks.every(s => s.completed);
			}
		}
	}
	checkAllCompleted(tasks){
		for(const task of tasks){
			if(!task.completed) return false;
			if(task.subtasks?.length && !this.checkAllCompleted(task.subtasks)) return false;
		}
		return true;
	}
	setAllCompleted(tasks, value){
		for(const task of tasks){
			task.completed = value;
			if(task.subtasks?.length) this.setAllCompleted(task.subtasks, value);
		}
	}
	renderTask(taskData, taskIndex, columnIndex, container, level, parentPath, taskManager){
		const path = parentPath ? `${parentPath}-${taskIndex}` : String(taskIndex);
		const isCollapsed = this.isCollapsed(path);
		const hasSubtasks = taskData.subtasks?.length > 0;
		const taskWrapper = document.createElement('div');
		taskWrapper.className = 'task-wrapper';
		taskWrapper.style.marginLeft = level * 30 + 'px';
		const taskLabel = document.createElement('label');
		taskLabel.className = 'task-label';
		taskLabel.dataset.taskIndex = taskIndex;
		taskLabel.dataset.columnIndex = columnIndex;
		taskLabel.dataset.taskPath = path;
		taskLabel.dataset.level = level;
		const checkbox = document.createElement('input');
		checkbox.className = 'checkbox';
		checkbox.type = 'checkbox';
		checkbox.checked = taskData.completed;
		const task = document.createElement('span');
		task.textContent = `${taskIndex + 1}. ${taskData.task}`;
		task.className = taskData.completed ? 'completed' : '';
		taskLabel.append(checkbox, task);
		if(taskData.timeStart && taskData.timeEnd){
			const timeSpan = document.createElement('span');
			timeSpan.className = 'task-time-display';
			timeSpan.textContent = ` [${taskData.timeStart}-${taskData.timeEnd}]`;
			taskLabel.append(timeSpan);
		}
		const taskDiv = document.createElement('div');
		taskDiv.className = 'task-div';
		if(hasSubtasks){
			const toggle = document.createElement('span');
			toggle.className = 'task-toggle';
			toggle.textContent = isCollapsed ? '>' : '<';
			taskDiv.append(toggle);
		}
		const drag = document.createElement('span');
		drag.className = 'drag';
		drag.textContent = '☰';
		const edit = document.createElement('span');
		edit.className = 'edit';
		edit.textContent = '✎';
		const close = document.createElement('span');
		close.className = 'close';
		close.textContent = '✖';
		taskDiv.append(drag, edit);
		if(level < 5){
			const addSub = document.createElement('span');
			addSub.className = 'add-subtask';
			addSub.textContent = '+';
			taskDiv.append(addSub);
		}
		taskDiv.append(close);
		taskLabel.append(taskDiv);
		taskWrapper.append(taskLabel);
		container.append(taskWrapper);
		if(hasSubtasks && !isCollapsed){
			const subtasksContainer = document.createElement('div');
			subtasksContainer.className = 'subtasks-container expanded';
			taskData.subtasks.forEach((sub, subIdx) => {
				this.renderTask(sub, subIdx, columnIndex, subtasksContainer, level + 1, path, taskManager);
			});
			container.append(subtasksContainer);
		}
	}
}
