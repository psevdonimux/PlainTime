export default class TaskManager{
	constructor(storageManager, panelManager, elements, themeManager, subtaskManager, timeManager, statisticsManager){
		this.storageManager = storageManager;
		this.panelManager = panelManager;
		this.elements = elements;
		this.themeManager = themeManager;
		this.subtaskManager = subtaskManager;
		this.timeManager = timeManager;
		this.statisticsManager = statisticsManager;
		this.modal = document.getElementById('modal-task-all');
		this.currentColumnForModal = null;
		this.strictModes = JSON.parse(this.storageManager.storage('strictModes') || '[false,false,false,false]');
		this.updateLockButtons();
	}
	bindEvents(){
		this.updateAllTaskLists();
		this.initDragAndDrop();
		this.initModalEvents();
		this.timeManager.init((day, col, text, start, end, parentPath) => this.createTask(day, col, text, start, end, parentPath));
		this.timeManager.setOnUpdate(() => this.updateAllTaskLists());
		this.statisticsManager.init();
		document.onclick = e => {
			const taskLabel = e.target.closest('.task-label');
			const columnIndex = taskLabel?.dataset.columnIndex;
			const taskPath = taskLabel?.dataset.taskPath || taskLabel?.dataset.taskIndex;
			const cl = e.target.classList;
			if(cl.contains('add-task')){
				const colIdx = [...document.querySelectorAll('.add-task')].indexOf(e.target);
				const input = e.target.closest('.input-row').querySelector('.input-task');
				if(!input.value.trim()) return;
				this.timeManager.setPendingTask({day: this.panelManager.getCurrentTaskDay(), column: colIdx, text: input.value.trim()});
				input.value = '';
				this.timeManager.openTimeModal();
			}
			else if(cl.contains('add-task-all')){
				this.currentColumnForModal = [...document.querySelectorAll('.add-task-all')].indexOf(e.target);
				const days = this.storageManager.storageJSON('days');
				const tasks = days[this.panelManager.getCurrentTaskDay()]?.[this.currentColumnForModal] || [];
				if(tasks.length) this.openModalForTask(this.currentColumnForModal);
			}
			else if(cl.contains('close')) this.deleteTask(this.panelManager.getCurrentTaskDay(), columnIndex, taskPath);
			else if(cl.contains('checkbox')){
				if(this.strictModes[columnIndex] && !this.canCompleteTask(columnIndex, taskPath)){
					e.preventDefault();
					alert('Сначала выполните предыдущие задачи по порядку');
					return;
				}
				this.updateTaskStatus(columnIndex, taskPath);
			}
			else if(cl.contains('lock-column')) this.toggleStrictMode(parseInt(e.target.dataset.column));
			else if(cl.contains('edit')) this.editTask(columnIndex, taskPath);
			else if(cl.contains('days')) this.panelManager.updateDays(e);
			else if(cl.contains('select-all-column')) this.toggleAllInColumn([...document.querySelectorAll('.column')].indexOf(e.target.closest('.column')));
			else if(cl.contains('add-subtask')) this.addSubtask(columnIndex, taskPath);
			else if(cl.contains('task-toggle')){ this.subtaskManager.toggleSubtasks(taskPath); this.updateAllTaskLists(); }
			else if(cl.contains('task-time-display')) this.timeManager.openEditTimeModal(columnIndex, taskPath);
		};
		document.onkeydown = e => {
			if(e.target.classList.contains('input-task') && e.key === 'Enter' && e.target.value.trim()){
				const i = [...document.querySelectorAll('.input-task')].indexOf(e.target);
				this.timeManager.setPendingTask({day: this.panelManager.getCurrentTaskDay(), column: i, text: e.target.value});
				e.target.value = '';
				this.timeManager.openTimeModal();
			}
		};
		this.elements.mode.onclick = () => { this.themeManager.toggleTheme(); this.themeManager.updateTheme(); };
		this.elements.export.onclick = () => this.panelManager.handleExport();
		this.elements.import.onclick = () => this.elements.fileInput.click();
		this.elements.fileInput.onchange = (e) => this.panelManager.handleImport(e);
		this.elements['reset-all-checks'].onclick = () => this.resetAllChecks();
		this.elements['delete-all-tasks'].onclick = () => this.deleteAllTasks();
		this.elements.statistics.onclick = () => this.statisticsManager.show();
	}
	createTask(day, index, text, timeStart = null, timeEnd = null, parentPath = null){
		const days = this.storageManager.storageJSON('days');
		days[day] ??= {};
		days[day][index] ??= [];
		const newTask = {task: text, completed: false, subtasks: []};
		if(timeStart && timeEnd){ newTask.timeStart = timeStart; newTask.timeEnd = timeEnd; }
		if(parentPath !== null){
			const task = this.subtaskManager.getTaskByPath(days[day][index], parentPath);
			if(task){ task.subtasks ??= []; task.subtasks.push(newTask); }
		} else {
			days[day][index].push(newTask);
		}
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
	}
	updateTaskStatus(columnIndex, taskPath){
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		if(!days[currentDay]?.[columnIndex]) return;
		const task = this.subtaskManager.getTaskByPath(days[currentDay][columnIndex], taskPath);
		if(task){
			const newStatus = !task.completed;
			task.completed = newStatus;
			if(task.subtasks?.length) this.subtaskManager.setAllCompleted(task.subtasks, newStatus);
			this.subtaskManager.checkParentCompletion(days[currentDay][columnIndex], taskPath);
			this.storageManager.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}
	deleteTask(day, columnIndex, taskPath){
		const days = this.storageManager.storageJSON('days');
		if(!days[day]?.[columnIndex]) return;
		this.subtaskManager.setTaskByPath(days[day][columnIndex], taskPath, null);
		if(!days[day][columnIndex].length) delete days[day][columnIndex];
		if(!Object.keys(days[day]).length) delete days[day];
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
	}
	updateAllTaskLists(targetDay = null){
		const days = this.storageManager.storageJSON('days');
		let currentDay = targetDay ?? this.panelManager.getCurrentTaskDay();
		for(let col = 0; col < 4; col++){
			const container = document.getElementsByClassName('list')[col];
			if(container){
				container.replaceChildren();
				days[currentDay]?.[col]?.forEach((taskData, idx) => {
					this.subtaskManager.renderTask(taskData, idx, col, container, 0, '', this);
				});
			}
		}
		currentDay = !currentDay ? 6 : --currentDay;
		document.querySelectorAll('.days').forEach(btn => btn.style.color = 'gray');
		document.querySelectorAll('.days')[currentDay].style.color = 'var(--text-color)';
	}
	editTask(columnIndex, taskPath){
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		if(!days[currentDay]?.[columnIndex]) return;
		const taskData = this.subtaskManager.getTaskByPath(days[currentDay][columnIndex], taskPath);
		if(!taskData) return;
		const taskLabel = document.querySelector(`[data-task-path="${taskPath}"][data-column-index="${columnIndex}"]`);
		const taskSpan = taskLabel.querySelector('span:not(.edit):not(.close):not(.drag):not(.add-subtask):not(.task-toggle):not(.task-time-display)');
		const originalText = taskData.task;
		const input = document.createElement('input');
		input.type = 'text';
		input.value = originalText;
		input.className = 'edit-input';
		input.style.cssText = 'flex:1;padding:4px;border:1px solid var(--text-color);background:var(--bg-color);color:var(--text-color);border-radius:4px;';
		taskSpan.replaceWith(input);
		input.focus();
		input.select();
		const saveEdit = () => {
			const newText = input.value.trim();
			if(newText && newText !== originalText){
				taskData.task = newText;
				this.storageManager.storageJSON('days', days);
			}
			this.updateAllTaskLists();
		};
		input.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); saveEdit(); } };
		input.onblur = saveEdit;
	}
	addSubtask(columnIndex, parentPath){
		const text = prompt('Введите подзадачу:');
		if(!text?.trim()) return;
		this.timeManager.setPendingTask({day: this.panelManager.getCurrentTaskDay(), column: parseInt(columnIndex), text: text.trim(), parentPath});
		this.timeManager.openTimeModal();
	}
	toggleAllInColumn(columnIndex){
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		if(!days[currentDay]?.[columnIndex]) return;
		const tasks = days[currentDay][columnIndex];
		this.subtaskManager.setAllCompleted(tasks, !this.subtaskManager.checkAllCompleted(tasks));
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
	}
	deleteAllTasks(){
		if(!confirm('Вы уверены что хотите удалить все задачи?')) return;
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		if(days[currentDay]){
			delete days[currentDay];
			this.storageManager.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}
	initDragAndDrop(){
		const state = {el: null, clone: null, pid: null, col: 0, idx: 0, ox: 0, oy: 0, path: null, level: 0};
		const reset = () => { state.clone?.remove(); Object.assign(state, {el: null, clone: null, pid: null, path: null, level: 0}); this.updateAllTaskLists(); };
		const getParentPath = path => { const parts = path.split('-'); return parts.length > 1 ? parts.slice(0, -1).join('-') : null; };
		const getSubtasksArray = (tasks, parentPath) => parentPath ? this.subtaskManager.getTaskByPath(tasks, parentPath)?.subtasks || [] : tasks;
		document.onpointerdown = e => {
			if(!e.target.classList.contains('drag')) return;
			e.preventDefault();
			state.pid = e.pointerId;
			e.target.setPointerCapture(state.pid);
			const label = e.target.closest('.task-label');
			const rect = label.getBoundingClientRect();
			setTimeout(() => {
				state.el = label;
				state.col = +label.dataset.columnIndex;
				state.idx = +label.dataset.taskIndex;
				state.path = label.dataset.taskPath;
				state.level = +label.dataset.level || 0;
				state.ox = e.clientX - rect.left;
				state.oy = e.clientY - rect.top;
				state.clone = label.cloneNode(true);
				state.clone.style.cssText = `position:fixed;width:${rect.width}px;opacity:.8;z-index:1000;left:${rect.left}px;top:${rect.top}px;pointer-events:none;background:var(--bg-color)`;
				document.body.append(state.clone);
			}, 200);
		};
		document.onpointermove = e => {
			if(!state.clone) return;
			e.preventDefault();
			state.clone.style.left = (e.clientX - state.ox) + 'px';
			state.clone.style.top = (e.clientY - state.oy) + 'px';
		};
		document.onpointerup = e => {
			if(state.pid != null) e.target.releasePointerCapture?.(state.pid);
			if(!state.el) return (state.pid = null);
			e.preventDefault();
			const target = document.elementFromPoint(e.clientX, e.clientY);
			const days = this.storageManager.storageJSON('days');
			const curDay = this.panelManager.getCurrentTaskDay();
			const {col, path, level} = state;
			if(!days[curDay]?.[col]) return reset();
			const parentPath = getParentPath(path);
			const sourceArray = getSubtasksArray(days[curDay][col], parentPath);
			const idx = parseInt(path.split('-').pop());
			const task = sourceArray[idx];
			if(!task) return reset();
			const removeFromSource = () => sourceArray.splice(idx, 1);
			const dayBtn = target?.closest('.days');
			if(dayBtn && level === 0){
				const toDay = ([...document.querySelectorAll('.days')].indexOf(dayBtn) + 1) % 7;
				if(toDay !== curDay){
					removeFromSource();
					if(!days[curDay][col].length) delete days[curDay][col];
					if(!Object.keys(days[curDay]).length) delete days[curDay];
					(days[toDay] ??= {})[col] ??= [];
					days[toDay][col].push(task);
					this.storageManager.storageJSON('days', days);
					return reset();
				}
			}
			const targetLabel = target?.closest('.task-label');
			if(targetLabel && targetLabel !== state.el){
				const targetPath = targetLabel.dataset.taskPath;
				const targetLevel = +targetLabel.dataset.level || 0;
				const targetCol = +targetLabel.dataset.columnIndex;
				const targetParentPath = getParentPath(targetPath);
				if(path.startsWith(targetPath + '-') || targetPath.startsWith(path + '-')) return reset();
				if(parentPath === targetParentPath && col === targetCol){
					const targetIdx = parseInt(targetPath.split('-').pop());
					const rect = targetLabel.getBoundingClientRect();
					let newPos = e.clientY > rect.top + rect.height / 2 ? targetIdx + 1 : targetIdx;
					removeFromSource();
					if(newPos > idx) newPos--;
					sourceArray.splice(newPos, 0, task);
					this.storageManager.storageJSON('days', days);
					return reset();
				}
				if(targetLevel < 5){
					const targetTask = this.subtaskManager.getTaskByPath(days[curDay][targetCol], targetPath);
					if(targetTask){
						removeFromSource();
						targetTask.subtasks ??= [];
						targetTask.subtasks.push(task);
						this.storageManager.storageJSON('days', days);
						return reset();
					}
				}
			}
			if(level === 0){
				const list = target?.closest('.list');
				if(list){
					const toCol = [...document.querySelectorAll('.list')].indexOf(list);
					const label = target?.closest('.task-label');
					let pos = 0;
					if(label && (+label.dataset.level || 0) === 0){
						pos = +label.dataset.taskIndex + (e.clientY > label.getBoundingClientRect().top + label.getBoundingClientRect().height / 2 ? 1 : 0);
					} else {
						pos = days[curDay][toCol]?.length || 0;
					}
					removeFromSource();
					if(!days[curDay][col].length) delete days[curDay][col];
					days[curDay][toCol] ??= [];
					if(col === toCol && pos > idx) pos--;
					days[curDay][toCol].splice(pos, 0, task);
					this.storageManager.storageJSON('days', days);
				}
			}
			reset();
		};
		document.onpointercancel = e => { if(state.pid != null) e.target.releasePointerCapture?.(state.pid); reset(); };
	}
	initModalEvents(){
		document.getElementById('select-all-tasks').onchange = e => this.modal.querySelectorAll('.task-checkbox').forEach(cb => cb.checked = e.target.checked);
		document.getElementById('select-all-days').onchange = e => this.modal.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = e.target.checked);
		this.modal.querySelector('.modal-apply').onclick = () => this.applyModalSelection();
		this.modal.querySelector('.modal-cancel').onclick = () => this.modal.close();
	}
	openModalForTask(columnIndex){
		this.currentColumnForModal = columnIndex;
		const days = this.storageManager.storageJSON('days');
		const tasks = days[this.panelManager.getCurrentTaskDay()]?.[columnIndex] || [];
		const container = document.getElementById('modal-tasks-list');
		container.replaceChildren();
		tasks.forEach((task, idx) => {
			const item = this.createModalTaskItem(idx);
			item.querySelector('.modal-item-text').textContent = ' ' + task.task;
			container.append(item);
		});
		document.getElementById('select-all-tasks').checked = false;
		document.getElementById('select-all-days').checked = false;
		this.modal.querySelectorAll('.task-checkbox').forEach(cb => cb.checked = false);
		this.modal.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
		this.modal.showModal();
	}
	createModalTaskItem(taskIndex){
		const label = document.createElement('label');
		label.className = 'modal-task-item';
		const leftDiv = document.createElement('div');
		leftDiv.className = 'modal-item-left';
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.className = 'task-checkbox';
		checkbox.dataset.taskIndex = taskIndex;
		const textSpan = document.createElement('span');
		textSpan.className = 'modal-item-text';
		if(taskIndex >= 0){
			const numberSpan = document.createElement('span');
			numberSpan.className = 'modal-task-number';
			numberSpan.textContent = `${taskIndex + 1}.`;
			textSpan.append(numberSpan);
		}
		const rightDiv = document.createElement('div');
		rightDiv.className = 'modal-item-right';
		leftDiv.append(checkbox, textSpan);
		label.append(leftDiv, rightDiv);
		return label;
	}
	resetAllChecks(){
		if(!confirm('Вы уверены?')) return;
		const days = this.storageManager.storageJSON('days');
		for(const day in days){
			for(const col in days[day]){
				this.subtaskManager.setAllCompleted(days[day][col], false);
			}
		}
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
	}
	applyModalSelection(){
		const selectedDays = [...this.modal.querySelectorAll('.day-checkbox:checked')].map(cb => parseInt(cb.value));
		const selectedTasks = [...this.modal.querySelectorAll('.task-checkbox:checked')];
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		const col = this.currentColumnForModal;
		selectedDays.forEach(dayIdx => {
			if(dayIdx === currentDay) return;
			days[dayIdx] ??= {};
			days[dayIdx][col] ??= [];
			selectedTasks.forEach(cb => {
				const src = days[currentDay]?.[col]?.[parseInt(cb.dataset.taskIndex)];
				if(src) days[dayIdx][col].push({task: src.task, completed: false, subtasks: JSON.parse(JSON.stringify(src.subtasks || []))});
			});
		});
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
		document.getElementById('modal-tasks-list').replaceChildren();
		this.modal.close();
	}
	toggleStrictMode(col){
		if(!this.strictModes[col]){
			if(!confirm('Вы уверены что хотите сделать задачи строго по порядку?')) return;
			this.strictModes[col] = true;
		} else {
			alert('Строгий режим отменён');
			this.strictModes[col] = false;
		}
		this.storageManager.storage('strictModes', JSON.stringify(this.strictModes));
		this.updateLockButtons();
	}
	updateLockButtons(){
		document.querySelectorAll('.lock-column').forEach(btn => {
			const col = parseInt(btn.dataset.column);
			btn.textContent = this.strictModes[col] ? '🔒' : '🔓';
			btn.classList.toggle('active', this.strictModes[col]);
		});
	}
	canCompleteTask(columnIndex, taskPath){
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		const col = parseInt(columnIndex);
		const task = this.subtaskManager.getTaskByPath(days[currentDay]?.[col] || [], taskPath);
		if(task?.completed) return true;
		const tasks = days[currentDay]?.[col] || [];
		const pathParts = taskPath.split('-');
		if(pathParts.length === 1){
			const idx = parseInt(taskPath);
			for(let i = 0; i < idx; i++){
				if(!tasks[i]?.completed) return false;
			}
		} else {
			const parentPath = pathParts.slice(0, -1).join('-');
			const parent = this.subtaskManager.getTaskByPath(tasks, parentPath);
			const idx = parseInt(pathParts[pathParts.length - 1]);
			for(let i = 0; i < idx; i++){
				if(!parent?.subtasks?.[i]?.completed) return false;
			}
		}
		return true;
	}
}
