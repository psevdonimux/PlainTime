export default class TaskManager{	

	constructor(storageManager, panelManager, elements, themeManager){
		this.storageManager = storageManager;
		this.panelManager = panelManager;
		this.elements = elements;
		this.themeManager = themeManager;
		this.modal = document.getElementById('modal-task-all');
		this.currentColumnForModal = null;
	}

	bindEvents(){
		this.updateAllTaskLists();
		this.initDragAndDrop();
		this.initModalEvents();
		document.onclick = (e) => {
			const taskLabel = e.target.closest('.task-label');
			const columnIndex = taskLabel?.dataset.columnIndex;
			const taskIndex = taskLabel?.dataset.taskIndex;
			if(e.target.classList.contains('add-task')){
				const addButtons = [...document.querySelectorAll('.add-task')];
				const columnIndex2 = addButtons.indexOf(e.target);
				const inputField = e.target.closest('.input-row').querySelector('.input-task');
				const taskValue = inputField.value.trim();
				if(taskValue !== ''){
					this.createTask(this.panelManager.getCurrentTaskDay(), columnIndex2, taskValue);
					inputField.value = '';	
				}
			}
			else if(e.target.classList.contains('add-task-all')){
				const addAllButtons = [...document.querySelectorAll('.add-task-all')];
				this.currentColumnForModal = addAllButtons.indexOf(e.target);		
				const days = this.storageManager.storageJSON('days');
				const currentDay = this.panelManager.getCurrentTaskDay();
				const currentTasks = days[currentDay]?.[this.currentColumnForModal] || [];	
				if(currentTasks.length > 0){
					this.openModalForTask(this.currentColumnForModal);
				}
			}
			else if(e.target.classList.contains('close')){				
				this.deleteTask(this.panelManager.getCurrentTaskDay(), columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('checkbox')){			
				this.updateTaskStatus(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('edit')){
				this.editTask(columnIndex, taskIndex);
			}
			else if(e.target.classList.contains('days')){
				this.panelManager.updateDays(e);
			}
		};
		document.onkeydown = (e) => {
			if(e.target.classList.contains('input-task') && e.key === 'Enter' && e.target.value.trim() !== ''){
				const i = [...document.querySelectorAll('.input-task')].indexOf(e.target);
				this.createTask(this.panelManager.getCurrentTaskDay(), i, e.target.value);
				e.target.value = '';
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

	updateTaskStatus(columnIndex, taskIndex){
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
		let el,data,clone,pid,drag,sx,sy,ox,oy,D=document,Q=(s,p=D)=>[...p.querySelectorAll(s)];
		const reset=()=>{clone?.remove();clone=el=data=pid=null;drag=0;this.updateAllTaskLists()};
		const rel=e=>pid!=null&&e.target.hasPointerCapture?.(pid)&&e.target.releasePointerCapture(pid);
		D.onpointerdown=e=>{
			if(!e.target.classList.contains('drag'))return;
			const t=e.target.closest('.task-label');
			e.preventDefault();e.stopPropagation();pid=e.pointerId;e.target.setPointerCapture(pid);sx=e.clientX;sy=e.clientY;
			setTimeout(()=>{
				drag=1;el=t;data={col:+t.dataset.columnIndex,idx:+t.dataset.taskIndex};
				const r=el.getBoundingClientRect();ox=sx-r.left;oy=sy-r.top;
				clone=el.cloneNode(1);
				clone.style.cssText=`position:fixed;width:${r.width}px;opacity:.8;z-index:1000;left:${sx-ox}px;top:${sy-oy}px;pointer-events:none;background:var(--bg-color)`;
				D.body.appendChild(clone);
			}, 200);
		};
		D.onpointermove=e=>{
			if(!drag||!clone)return;
			e.preventDefault();e.stopPropagation();clone.style.left=e.clientX-ox+'px';clone.style.top=e.clientY-oy+'px';
		};
		D.onpointerup=e=>{
			rel(e);if(!drag||!el)return void(pid=null);
			e.preventDefault();e.stopPropagation();
			const b=D.elementFromPoint(e.clientX,e.clientY),dayB=b?.closest('.days'),listB=b?.closest('.list'),days=this.storageManager.storageJSON('days'),{col,idx}=data,cur=this.panelManager.getCurrentTaskDay();
			if(days[cur]?.[col]){
				const task=days[cur][col][idx],src=days[cur][col],rm=()=>{src.splice(idx,1);!src.length&&delete days[cur][col]};
				if(dayB){
					const t=(Q('.days').indexOf(dayB)+1)%7;
					t!==cur&&(rm(),!Object.keys(days[cur]).length&&delete days[cur],(days[t]??={})[col]??=[],days[t][col].push(task),this.storageManager.storageJSON('days',days));
				}
				else if(listB){
					const tCol=Q('.list').indexOf(listB),taskB=b.closest('.task-label');
					let ti=taskB?((r,i=+taskB.dataset.taskIndex)=>e.clientY<r.top+r.height/2?i:i+1)(taskB.getBoundingClientRect()):Q('.task-label',listB).length;
					rm();days[cur][tCol]??=[];col===tCol&&ti>idx&&ti--;days[cur][tCol].splice(ti,0,task);this.storageManager.storageJSON('days',days);
				}
			}
			reset();
		};
		D.onpointercancel=e=>{rel(e);reset()};
	}

	initModalEvents(){
		const selectAllTasks = document.getElementById('select-all-tasks');
		const selectAllDays = document.getElementById('select-all-days');
		const modalApply = this.modal.querySelector('.modal-apply');
		const modalCancel = this.modal.querySelector('.modal-cancel');
		selectAllTasks?.addEventListener('change', (e) => {
				const taskCheckboxes = this.modal.querySelectorAll('.task-checkbox');
				taskCheckboxes.forEach(cb => cb.checked = e.target.checked);
		});
		selectAllDays?.addEventListener('change', (e) => {
				const dayCheckboxes = this.modal.querySelectorAll('.day-checkbox');
				dayCheckboxes.forEach(cb => cb.checked = e.target.checked);
		});
		modalApply?.addEventListener('click', () => this.applyModalSelection());
		modalCancel?.addEventListener('click', () => this.modal.close());
	}

	openModalForTask(columnIndex){
		this.currentColumnForModal = columnIndex;
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		const currentTasks = days[currentDay]?.[columnIndex] || [];
		const tasksListContainer = document.getElementById('modal-tasks-list');		
		if(tasksListContainer){
				tasksListContainer.innerHTML = ''; 
				currentTasks.forEach((task, index) => {
						const taskItem = this.createModalTaskItem(index);
						const textSpan = taskItem.querySelector('.modal-item-text');
						const taskTextNode = document.createTextNode(' ' + task.task);
						textSpan.appendChild(taskTextNode);
						tasksListContainer.appendChild(taskItem);
				});
		}
		
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
				textSpan.appendChild(numberSpan);
		}				
		const rightDiv = document.createElement('div');
		rightDiv.className = 'modal-item-right';
		leftDiv.appendChild(checkbox);
		leftDiv.appendChild(textSpan);				
		label.appendChild(leftDiv);
		label.appendChild(rightDiv);
		return label;
	}

	applyModalSelection(){
		const selectedDays = [...this.modal.querySelectorAll('.day-checkbox:checked')].map(cb => parseInt(cb.value));
		const selectedTasks = [...this.modal.querySelectorAll('.task-checkbox:checked')];	
		if(selectedDays.length === 0 || selectedTasks.length === 0){
				this.modal.close();
				return;
		}		
		const days = this.storageManager.storageJSON('days');
		const currentDay = this.panelManager.getCurrentTaskDay();
		const columnIndex = this.currentColumnForModal;		
		selectedDays.forEach(dayIndex => {
				if(dayIndex === currentDay) return;				 
				days[dayIndex] = days[dayIndex] || {};
				days[dayIndex][columnIndex] = days[dayIndex][columnIndex] || [];				
				selectedTasks.forEach(taskCheckbox => {
						const taskIndex = parseInt(taskCheckbox.dataset.taskIndex);
						const sourceTask = days[currentDay]?.[columnIndex]?.[taskIndex];												
						if(sourceTask){
								days[dayIndex][columnIndex].push({
										task: sourceTask.task,
										completed: false
								});
						}
				});
		});
		
		this.storageManager.storageJSON('days', days);
		this.updateAllTaskLists();
		const tasksListContainer = document.getElementById('modal-tasks-list');
		if(tasksListContainer){
				tasksListContainer.innerHTML = '';
		}		
		this.modal.close();
	}
}