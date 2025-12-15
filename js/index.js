class SimpleApp {

	constructor(){
		this.elements = this.getElements();
		this.dataset = document.documentElement.dataset;
		this.currentDays = new Date().getDay();
		this.updateTheme();
		this.bindEvents();
	}

	getElements(){
		const ids = ['mode', 'random', 'close', 'modalSettings', 'settings',
			'delete', 'optionsMenu', 'mode', 'fileInput', 'import', 'export', 'import'
		];
		return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
	}

	storage(key, value = undefined){
		if(value === undefined){
			return localStorage.getItem(key);
		}
		if(value === null){
			localStorage.removeItem(key);
		}
		else{
			localStorage.setItem(key, value);
		}
	}

	storageJSON(key, value = undefined){
		if(value === undefined){
			return JSON.parse(this.storage(key) || '{}');
		}
		this.storage(key, JSON.stringify(value));
	}

	toggleTheme(){
		const theme = this.storage('theme') === 'light' ? 'dark' : 'light';
		this.dataset.theme = theme;
		this.storage('theme', theme);
	}

	updateTheme(){
		if(this.storage('theme') === 'light'){
			this.dataset.theme = 'light';
		}
		this.elements.mode.textContent = this.storage('theme') === 'light' ? 'Светлая' : 'Тёмная';
	}

	loadImage(){
		const imageSrc = this.storage('image');
		if(imageSrc){
			document.body.style.cssText = `
				background-image: url(${imageSrc});
				background-size: ${window.innerWidth}px ${window.innerHeight}px;
			`;
		}
	}

	bindEvents(){
		this.updateAllTaskLists();
		this.initDragAndDrop();
		let addTaskElements = document.getElementsByClassName('add-task');
		let checkboxElements = document.getElementsByClassName('checkbox');
		let inputTaskElements = document.getElementsByClassName('input-task');
		for(let i = 0; i < addTaskElements.length; i++){
			let column = i;
			addTaskElements[i].onclick = () => {
				this.createTask(this.currentDays, column, document.getElementsByClassName('input-task')[i].value);
				document.getElementsByClassName('input-task')[i].value = '';
			};
		}
		for(let i = 0; i < checkboxElements.length; i++){
			let column = i;
			checkboxElements[i].onclick = (e) => {
				const taskLabel = e.target.closest('.task-label');
				const columnIndex = parseInt(taskLabel.dataset.columnIndex);
				const taskIndex = parseInt(taskLabel.dataset.taskIndex);
				this.updateTaskStatus(columnIndex, taskIndex);
			};
		}
		for(let i = 0; i < inputTaskElements.length; i++){
			let column = i;
			inputTaskElements[i].onchange = () => {
				this.createTask(this.currentDays, column, document.getElementsByClassName('input-task')[i].value);
				document.getElementsByClassName('input-task')[i].value = '';
			};
		}
		document.onclick = (e) => {
			if(e.target.classList.contains('close')){
				const taskLabel = e.target.closest('.task-label');
				const columnIndex = parseInt(taskLabel.dataset.columnIndex);
				const taskIndex = parseInt(taskLabel.dataset.taskIndex);
				this.deleteTask(this.currentDays, columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('checkbox')){
				const taskLabel = e.target.closest('.task-label');
				const columnIndex = parseInt(taskLabel.dataset.columnIndex);
				const taskIndex = parseInt(taskLabel.dataset.taskIndex);
				this.updateTaskStatus(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('edit')){
				const taskLabel = e.target.closest('.task-label');
				const columnIndex = parseInt(taskLabel.dataset.columnIndex);
				const taskIndex = parseInt(taskLabel.dataset.taskIndex);
				this.editTask(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('days')){
				this.updateDays(e);
			}
		};
		this.elements.mode.onclick = () => {
			this.toggleTheme();
			this.updateTheme();
		};
		function getNearestMondayToSundayRange(){
			const today = new Date();
			const day = today.getDay();
			const diffToMonday = (day === 0) ? -6 : (1 - day);
			const monday = new Date(today);
			monday.setDate(today.getDate() + diffToMonday);
			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);
			const formatDate = (date) => {
				const dd = String(date.getDate()).padStart(2, '0');
				const mm = String(date.getMonth() + 1).padStart(2, '0');
				const yyyy = date.getFullYear();
				return `${dd}.${mm}.${yyyy}`;
			};
			return `${formatDate(monday)}-${formatDate(sunday)}_PlainTime`;
		}
		this.elements.export.onclick = () => {
			let days = getNearestMondayToSundayRange();
			const link = document.createElement('a');
			link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(days));
			link.download = days;
			const jsonString = JSON.stringify(this.storageJSON('days'), null, 2);
			const blob = new Blob([jsonString], {
				type: 'application/json'
			});
			const url = URL.createObjectURL(blob);
			link.href = url;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		};
		this.elements.import.onclick = () => this.elements.fileInput.click();
		this.elements.fileInput.onchange = (e) => {
			const reader = new FileReader();
			reader.onload = (event) => {
				const dataFromFile = JSON.parse(event.target.result);
				this.storageJSON("days", dataFromFile);
				this.updateAllTaskLists();
			};
			reader.readAsText(e.target.files[0]);
			e.target.value = "";
		};
	}

	updateDays(e){
		let clickedIndex = Array.from(e.target.closest('#panel').querySelectorAll('.days')).indexOf(e.target);
		if(clickedIndex == 6){
			clickedIndex = 0;
		}
		else{
			clickedIndex++;
		}
		this.setCurrentDays(clickedIndex);
		document.querySelectorAll('.days').forEach(btn => {
			btn.style.color = 'gray';
		});
		e.target.style.color = 'var(--text-color)';
	}

	createTask(day, index, text){
		let days = this.storageJSON('days');
		days[day] = days[day] ?? {}
		days[day][index] = days[day][index] ?? [];
		days[day][index].push({
			"task": text,
			"completed": false,
		});
		this.storageJSON('days', days);
		this.updateAllTaskLists();
	}

	updateTaskStatus(columnIndex, taskIndex, completed = null){
		let days = this.storageJSON('days');
		let currentDay = this.currentDays;
		if(days[currentDay] && days[currentDay][columnIndex] && days[currentDay][columnIndex][taskIndex]){
			let task = days[currentDay][columnIndex][taskIndex];
			task.completed = !task.completed;
			this.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}

	setCurrentDays(day){
		this.currentDays = day;
		this.updateAllTaskLists();
	}

	deleteTask(day, columnIndex, taskIndex){
		let days = this.storageJSON('days');
		if(days[day] && days[day][columnIndex] && days[day][columnIndex][taskIndex]){
			days[day][columnIndex].splice(taskIndex, 1);
			if(days[day][columnIndex].length === 0){
				delete days[day][columnIndex];
			}
			if(Object.keys(days[day]).length === 0){
				delete days[day];
			}
			this.storageJSON('days', days);
			this.updateAllTaskLists();
		}
	}

	updateAllTaskLists(targetDay = null){
		let days = this.storageJSON('days');
		let currentDay = targetDay ?? this.currentDays;
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
		let days = this.storageJSON('days');
		let currentDay = this.currentDays;
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
					this.storageJSON('days', days);
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
			let days = this.storageJSON('days');
			const sourceCol = draggedData.columnIndex;
			const sourceIdx = draggedData.taskIndex;
			const currentDay = this.currentDays;
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
						this.storageJSON('days', days);
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
					this.storageJSON('days', days);
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
new SimpleApp();
