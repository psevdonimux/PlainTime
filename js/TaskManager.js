export default class TaskManager{	

	constructor(storageManager, panelManager){
		this.storageManager = storageManager;
		this.panelManager = panelManager;
	}

	createTask(day, index, text){
		let days = this.storageManager.storageJSON('days');
		days[day] = days[day] ?? {}
		days[day][index] = days[day][index] ?? [];
		days[day][index].push({
			"task": text,
			"completed": false,
		});
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
	}

	updateTaskStatus(columnIndex, taskIndex, completed = null){
		let days = this.storageManager.storageJSON('days');
		let currentDay = this.panelManager.getCurrentTaskDay();
		if(days[currentDay] && days[currentDay][columnIndex] && days[currentDay][columnIndex][taskIndex]){
			let task = days[currentDay][columnIndex][taskIndex];
			task.completed = !task.completed;
			this.storageManager.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}

	deleteTask(day, columnIndex, taskIndex){
		let days = this.storageManager.storageJSON('days');
		if(days[day] && days[day][columnIndex] && days[day][columnIndex][taskIndex]){
			days[day][columnIndex].splice(taskIndex, 1);
			if(days[day][columnIndex].length === 0){
				delete days[day][columnIndex];
			}
			if(Object.keys(days[day]).length === 0){
				delete days[day];
			}
			this.storageManager.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}

	updateAllTaskLists(targetDay = null){
		let days = this.storageManager.storageJSON('days');
		let currentDay = targetDay ?? this.panelManager.getCurrentTaskDay();
		for (let columnIndex = 0; columnIndex < 4; columnIndex++){
			let taskContainer = document.getElementsByClassName('list')[columnIndex];
			if(taskContainer){
				taskContainer.innerHTML = '';
				if(days[currentDay] && days[currentDay][columnIndex]){
					days[currentDay][columnIndex].forEach((taskData, taskIndex) => {
						let taskLabel = document.createElement('label');
						taskLabel.className = 'task-label';
						taskLabel.dataset.taskIndex = taskIndex;
						taskLabel.dataset.columnIndex = columnIndex;
						let checkbox = document.createElement('input');
						checkbox.className = 'checkbox';
						checkbox.type = 'checkbox';
						checkbox.checked = taskData.completed;
						let task = document.createElement('span');
						task.textContent = `${taskIndex + 1}. ${taskData.task}`;
						task.className = taskData.completed ? 'completed' : '';
						let taskDiv = document.createElement('div');
						taskDiv.className = 'task-div';
						let drag = document.createElement('span');
						drag.className = 'drag';
						drag.textContent = '☰';
						let edit = document.createElement('span');
						edit.className = 'edit';
						edit.textContent = '✎';
						let close = document.createElement('span');
						close.className = 'close';
						close.textContent = '✖';
						taskLabel.appendChild(checkbox);
						taskLabel.appendChild(task);
						taskDiv.appendChild(drag);
						taskDiv.appendChild(edit);
						taskDiv.appendChild(close);
						taskLabel.appendChild(taskDiv);
						taskContainer.appendChild(taskLabel);
					});
				}
			}
		}
		if(currentDay == 0){
			currentDay = 6;
		}
		else{
			currentDay--;
		}		
		document.querySelectorAll('.days').forEach(btn =>{
			btn.style.color = 'gray';
		});
		document.querySelectorAll('.days')[currentDay].style.color = 'var(--text-color)';
	}

	editTask(columnIndex, taskIndex){
		let days = this.storageManager.storageJSON('days');
		let currentDay = this.panelManager.getCurrentTaskDay();
		if(days[currentDay] && days[currentDay][columnIndex] && days[currentDay][columnIndex][taskIndex]){
			const taskLabel = document.querySelector(`[data-column-index="${columnIndex}"][data-task-index="${taskIndex}"]`);
			const taskSpan = taskLabel.querySelector('span:not(.edit):not(.close)');
			const originalText = days[currentDay][columnIndex][taskIndex].task;
			const taskNumber = `${taskIndex + 1}. `;
			const input = document.createElement('input');
			input.type = 'text';
			input.value = originalText;
			input.className = 'edit-input';
			input.style.cssText = 'flex: 1; padding: 4px; border: 1px solid var(--text-color); background: var(--bg-color); color: var(--text-color); border-radius: 4px;';
			taskSpan.replaceWith(input);
			input.focus();
			input.select();
			const saveEdit = () => {
				const newText = input.value.trim();
				if(newText !== '' && newText !== originalText){
					days[currentDay][columnIndex][taskIndex].task = newText;
					this.storageManager.storageJSON('days', days);
				}
				this.updateAllTaskLists();
			};
			const cancelEdit = () => {
				this.updateAllTaskLists();
			};
			input.onkeydown = (e) => {
				if(e.key === 'Enter'){
					e.preventDefault();
					saveEdit();
				} else if(e.key === 'Escape'){
					e.preventDefault();
					cancelEdit();
				}
			};
			input.onblur = () => {
				saveEdit();
			};
		}
	}

	initDragAndDrop(){
		let draggedElement = null;
		let draggedData = null;
		let isDragging = false;
		let startX = 0;
		let startY = 0;
		let offsetX = 0;
		let offsetY = 0;
		let clone = null;
		let pointerId = null;
		document.addEventListener('pointerdown', (e) => {
			if(!e.target.classList.contains('drag')) return;
			const taskLabel = e.target.closest('.task-label');
			if(!taskLabel) return;
			e.preventDefault();
			e.stopPropagation();
			pointerId = e.pointerId;
			e.target.setPointerCapture(e.pointerId);
			startX = e.clientX;
			startY = e.clientY;
			setTimeout(() => {
				if(!pointerId) return;
				isDragging = true;
				draggedElement = taskLabel;
				draggedData = {
					columnIndex: parseInt(taskLabel.dataset.columnIndex),
					taskIndex: parseInt(taskLabel.dataset.taskIndex)
				};
				const rect = draggedElement.getBoundingClientRect();
				offsetX = startX - rect.left;
				offsetY = startY - rect.top;
				clone = draggedElement.cloneNode(true);
				clone.style.position = 'fixed';
				clone.style.width = rect.width + 'px';
				clone.style.opacity = '0.8';
				clone.style.zIndex = '1000';
				clone.style.left = (startX - offsetX) + 'px';
				clone.style.top = (startY - offsetY) + 'px';
				clone.style.pointerEvents = 'none';
				clone.style.background = 'var(--bg-color)';
				document.body.appendChild(clone);
				draggedElement.style.opacity = '0.2';
			}, 200);
		});
		document.addEventListener('pointermove', (e) => {
			if(!isDragging || !clone) return;
			e.preventDefault();
			e.stopPropagation();
			clone.style.left = (e.clientX - offsetX) + 'px';
			clone.style.top = (e.clientY - offsetY) + 'px';
		});
		document.onpointerup = (e) => {
			if(pointerId !== null && e.target.hasPointerCapture){
				e.target.releasePointerCapture(pointerId);
			}
			if(!isDragging || !draggedElement){
				pointerId = null;
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			if(clone) clone.style.display = 'none';
			const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
			if(clone) clone.style.display = 'block';
			const dayBelow = elemBelow?.closest('.days');
			const listBelow = elemBelow?.closest('.list');
			let days = this.storageManager.storageJSON('days');
			const sourceCol = draggedData.columnIndex;
			const sourceIdx = draggedData.taskIndex;
			const currentDay = this.panelManager.getCurrentTaskDay();
			if(days[currentDay] && days[currentDay][sourceCol]){
				const task = days[currentDay][sourceCol][sourceIdx];
				if(dayBelow){
					const allDays = Array.from(document.querySelectorAll('.days'));
					let domIndex = allDays.indexOf(dayBelow);
					let targetDayId = (domIndex === 6) ? 0 : domIndex + 1;
					if(targetDayId !== currentDay){
						days[currentDay][sourceCol].splice(sourceIdx, 1);
						if(days[currentDay][sourceCol].length === 0) delete days[currentDay][sourceCol];
						if(Object.keys(days[currentDay]).length === 0) delete days[currentDay];
						days[targetDayId] = days[targetDayId] ?? {};
						days[targetDayId][sourceCol] = days[targetDayId][sourceCol] ?? [];
						days[targetDayId][sourceCol].push(task);
						this.storageManager.storageJSON('days', days);
					}
				}
				else if(listBelow){
					const allLists = Array.from(document.querySelectorAll('.list'));
					const targetColumn = allLists.indexOf(listBelow);
					const taskBelow = elemBelow.closest('.task-label');
					let targetIndex;
					if(taskBelow){
						const rect = taskBelow.getBoundingClientRect();
						const middleY = rect.top + rect.height / 2;
						const tIndex = parseInt(taskBelow.dataset.taskIndex);
						targetIndex = e.clientY < middleY ? tIndex : tIndex + 1;
					}
					else{
						targetIndex = listBelow.querySelectorAll('.task-label').length;
					}
					days[currentDay][sourceCol].splice(sourceIdx, 1);
					if(days[currentDay][sourceCol].length === 0) delete days[currentDay][sourceCol];
					days[currentDay][targetColumn] = days[currentDay][targetColumn] ?? [];
					if(sourceCol === targetColumn && targetIndex > sourceIdx){
						targetIndex--;
					}
					days[currentDay][targetColumn].splice(targetIndex, 0, task);
					this.storageManager.storageJSON('days', days);
				}
			}
			if(clone){
				clone.remove();
				clone = null;
			}
			if(draggedElement){
				draggedElement.style.opacity = '';
				draggedElement = null;
			}
			draggedData = null;
			isDragging = false;
			pointerId = null;
			this.updateAllTaskLists();
		};
		document.onpointercancel = (e) => {
			if(pointerId !== null && e.target.hasPointerCapture){
				e.target.releasePointerCapture(pointerId);
			}
			if(clone) clone.remove();
			if(draggedElement) draggedElement.style.opacity = '';
			clone = null;
			draggedElement = null;
			draggedData = null;
			isDragging = false;
			pointerId = null;
			this.updateAllTaskLists();
		};
	}


}