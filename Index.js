class TaskManager {
    constructor() {
        this.days = [
            { id: 'monday', name: 'Понедельник' },
            { id: 'tuesday', name: 'Вторник' },
            { id: 'wednesday', name: 'Среда' },
            { id: 'thursday', name: 'Четверг' },
            { id: 'friday', name: 'Пятница' },
            { id: 'saturday', name: 'Суббота' },
            { id: 'sunday', name: 'Воскресенье' }
        ];
        this.quadrants = [
    { id: 1, name: 'Основные задачи' },
    { id: 2, name: 'Второстепенные задачи' },
    { id: 3, name: 'Мелкие задачи' },
    { id: 4, name: 'Ненужные задачи' }
];

        this.tasks = {};
        this.activeTimers = {};
        this.initTasks();
        this.migrateTaskData();
        this.createAppStructure();
        this.setupDayTabs();
        this.renderAllTasks();
        this.setupEnterKeyHandler();
        setInterval(() => this.checkDeadlines(), 60000);
    }
    initTasks() {
        const savedTasks = localStorage.getItem('eisenhowerTasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        } else {
            this.days.forEach(day => {
                this.tasks[day.id] = {};
                this.quadrants.forEach(quadrant => {
                    this.tasks[day.id][quadrant.id] = [];
                });
            });
            this.saveTasks();
        }
    }
    migrateTaskData() {
        this.days.forEach(day => {
            this.quadrants.forEach(quadrant => {
                if (this.tasks[day.id] && this.tasks[day.id][quadrant.id]) {
                    this.tasks[day.id][quadrant.id].forEach(task => {
                        if (task.deadline && (!task.startDeadline || !task.endDeadline)) {
                            const deadline = new Date(task.deadline);
                            const startDeadline = new Date(deadline.getTime() - 60*60*1000);
                            task.startDeadline = startDeadline.toISOString();
                            task.endDeadline = task.deadline;
                            delete task.deadline;
                        }
                    });
                }
            });
        });
        this.saveTasks();
    }
    saveTasks() {
        localStorage.setItem('eisenhowerTasks', JSON.stringify(this.tasks));
    }
    createAppStructure() {
        const appContainer = document.getElementById('app');
        this.days.forEach(day => {
            const dayContent = document.createElement('div');
            dayContent.className = `day-content ${day.id === 'monday' ? 'active' : ''}`;
            dayContent.id = `content-${day.id}`;
            const dayHeader = document.createElement('h2');
            dayHeader.textContent = day.name;
            dayContent.appendChild(dayHeader);
            this.quadrants.forEach(quadrant => {
                const quadrantElement = document.createElement('div');
                quadrantElement.className = `quadrant quadrant-${quadrant.id}`;
                const quadrantHeader = document.createElement('h3');
                quadrantHeader.textContent = quadrant.name;
                quadrantElement.appendChild(quadrantHeader);
                const taskList = document.createElement('ul');
                taskList.className = 'task-list';
                taskList.id = `task-list-${day.id}-${quadrant.id}`;
                quadrantElement.appendChild(taskList);
                const addTaskForm = document.createElement('div');
                addTaskForm.className = 'add-task-form';
                const addTaskInput = document.createElement('input');
                addTaskInput.type = 'text';
                addTaskInput.className = 'add-task-input';
                addTaskInput.placeholder = 'Добавить новую задачу...';
                addTaskForm.appendChild(addTaskInput);
                const addTaskBtn = document.createElement('button');
                addTaskBtn.className = 'add-task-btn';
                addTaskBtn.textContent = 'Добавить';
                addTaskBtn.addEventListener('click', () => {
                    const taskText = addTaskInput.value.trim();
                    if (taskText) {
                        this.addTask(day.id, quadrant.id, taskText);
                        addTaskInput.value = '';
                    }
                });
                addTaskForm.appendChild(addTaskBtn);
                quadrantElement.appendChild(addTaskForm);
                dayContent.appendChild(quadrantElement);
            });
            appContainer.appendChild(dayContent);
        });
    }
    setupEnterKeyHandler() {
        document.querySelectorAll('.add-task-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const btn = input.nextElementSibling;
                    if (btn) btn.click();
                }
            });
        });
    }
    addTask(dayId, quadrantId, text) {
        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            time: 0,
            plannedTime: 0,
            startDeadline: null,
            endDeadline: null
        };
        this.tasks[dayId][quadrantId].push(newTask);
        this.saveTasks();
        this.renderTasks(dayId, quadrantId);
    }
    deleteTask(dayId, quadrantId, taskId) {
        if (this.activeTimers[taskId]) {
            clearInterval(this.activeTimers[taskId]);
            delete this.activeTimers[taskId];
        }
        this.tasks[dayId][quadrantId] = this.tasks[dayId][quadrantId].filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks(dayId, quadrantId);
    }
    toggleTaskComplete(dayId, quadrantId, taskId) {
        const taskIndex = this.tasks[dayId][quadrantId].findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[dayId][quadrantId][taskIndex].completed = !this.tasks[dayId][quadrantId][taskIndex].completed;
            this.saveTasks();
            this.renderTasks(dayId, quadrantId);
        }
    }
    setTaskPlannedTime(dayId, quadrantId, taskId) {
        const taskIndex = this.tasks[dayId][quadrantId].findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const minutes = prompt("Укажите время для выполнения (в минутах):", 
                Math.floor(this.tasks[dayId][quadrantId][taskIndex].plannedTime / 60));
            if (minutes !== null && !isNaN(minutes)) {
                this.tasks[dayId][quadrantId][taskIndex].plannedTime = parseInt(minutes) * 60;
                this.saveTasks();
                this.renderTasks(dayId, quadrantId);
            }
        }
    }
    setTaskDeadline(dayId, quadrantId, taskId) {
        const taskIndex = this.tasks[dayId][quadrantId].findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const task = this.tasks[dayId][quadrantId][taskIndex];
            const now = new Date();
            const startDate = task.startDeadline ? new Date(task.startDeadline) : now;
            const endDate = task.endDeadline ? new Date(task.endDeadline) : new Date(now.getTime() + 24*60*60*1000);
            const formatDateForInput = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };
            const startStr = prompt("Введите начало дедлайна (дата и время):", formatDateForInput(startDate));
            if (!startStr) return;
            try {
                const startDeadline = new Date(startStr);
                if (isNaN(startDeadline.getTime())) {
                    alert("Неверный формат даты начала");
                    return;
                }
                const endStr = prompt("Введите конец дедлайна (дата и время):", formatDateForInput(endDate));
                if (!endStr) return;
                const endDeadline = new Date(endStr);
                if (isNaN(endDeadline.getTime())) {
                    alert("Неверный формат даты окончания");
                    return;
                }
                if (endDeadline <= startDeadline) {
                    alert("Дата окончания должна быть позже даты начала");
                    return;
                }
                this.tasks[dayId][quadrantId][taskIndex].startDeadline = startDeadline.toISOString();
                this.tasks[dayId][quadrantId][taskIndex].endDeadline = endDeadline.toISOString();
                this.saveTasks();
                this.renderTasks(dayId, quadrantId);
            } catch (e) {
                alert("Ошибка при установке дедлайна: " + e.message);
            }
        }
    }
    startTimer(dayId, quadrantId, taskId) {
        if (this.activeTimers[taskId]) {
            return;
        }
        const taskIndex = this.tasks[dayId][quadrantId].findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        const timerDisplay = document.getElementById(`timer-${taskId}`);
        const startBtn = document.getElementById(`start-${taskId}`);
        const pauseBtn = document.getElementById(`pause-${taskId}`);
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline';
        timerDisplay.classList.add('timer-active');
        const startTime = Date.now() - (this.tasks[dayId][quadrantId][taskIndex].time * 1000);
        this.activeTimers[taskId] = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            this.tasks[dayId][quadrantId][taskIndex].time = elapsedSeconds;
            timerDisplay.textContent = this.formatTime(elapsedSeconds);
            if (elapsedSeconds % 5 === 0) {
                this.saveTasks();
            }
        }, 1000);
    }
    pauseTimer(dayId, quadrantId, taskId) {
        if (!this.activeTimers[taskId]) {
            return;
        }
        clearInterval(this.activeTimers[taskId]);
        delete this.activeTimers[taskId];
        const timerDisplay = document.getElementById(`timer-${taskId}`);
        const startBtn = document.getElementById(`start-${taskId}`);
        const pauseBtn = document.getElementById(`pause-${taskId}`);
        startBtn.style.display = 'inline';
        pauseBtn.style.display = 'none';
        timerDisplay.classList.remove('timer-active');
        this.saveTasks();
    }
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    formatDeadline(startDeadline, endDeadline) {
        if (!startDeadline || !endDeadline) return '';
        const start = new Date(startDeadline);
        const end = new Date(endDeadline);
        const now = new Date();
        const formatDate = (date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${day}.${month} ${hours}:${minutes}`;
        };
        let status = '';
        if (now < start) {
            const diffMs = start - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) {
                status = `(через ${diffHours}ч)`;
            } else {
                const diffDays = Math.floor(diffHours / 24);
                status = `(через ${diffDays}д)`;
            }
        } else if (now >= start && now <= end) {
            const diffMs = end - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours < 24) {
                status = `(${diffHours}ч осталось)`;
            } else {
                const diffDays = Math.floor(diffHours / 24);
                status = `(${diffDays}д осталось)`;
            }
        } else {
            status = '(просрочено)';
        }
        return `${formatDate(start)} - ${formatDate(end)} ${status}`;
    }
    getDeadlineClass(startDeadline, endDeadline) {
        if (!startDeadline || !endDeadline) return '';
        const start = new Date(startDeadline);
        const end = new Date(endDeadline);
        const now = new Date();
        if (now > end) {
            return 'deadline-passed';
        } else if (now >= start && now <= end) {
            const totalDuration = end - start;
            const elapsed = now - start;
            const percentLeft = 100 - (elapsed / totalDuration * 100);
            if (percentLeft < 25) {
                return 'deadline-approaching';
            }
        }
        return '';
    }
    renderTasks(dayId, quadrantId) {
        const taskList = document.getElementById(`task-list-${dayId}-${quadrantId}`);
        if (!taskList) return;
        taskList.innerHTML = '';
        if (!this.tasks[dayId] || !this.tasks[dayId][quadrantId]) return;
        this.tasks[dayId][quadrantId].forEach((task, index) => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
            const taskIndex = document.createElement('span');
            taskIndex.className = 'task-index';
            taskIndex.textContent = `${index + 1}.`;
            taskItem.appendChild(taskIndex);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTaskComplete(dayId, quadrantId, task.id));
            taskItem.appendChild(checkbox);
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            taskItem.appendChild(taskText);
            const taskActions = document.createElement('div');
            taskActions.className = 'task-actions';
            const timerDisplay = document.createElement('span');
            timerDisplay.className = 'timer-display';
            timerDisplay.id = `timer-${task.id}`;
            timerDisplay.textContent = this.formatTime(task.time);
            taskActions.appendChild(timerDisplay);
            if (task.startDeadline && task.endDeadline) {
                const deadlineDisplay = document.createElement('span');
                deadlineDisplay.className = `deadline-display ${this.getDeadlineClass(task.startDeadline, task.endDeadline)}`;
                deadlineDisplay.id = `deadline-${task.id}`;
                deadlineDisplay.textContent = this.formatDeadline(task.startDeadline, task.endDeadline);
                taskActions.appendChild(deadlineDisplay);
            }
            const timerControls = document.createElement('div');
            timerControls.className = 'task-timer-controls';
            const startBtn = document.createElement('button');
            startBtn.className = 'task-btn btn-start';
            startBtn.id = `start-${task.id}`;
            startBtn.innerHTML = '&#9654;';
            startBtn.title = 'Запустить таймер';
            startBtn.style.display = this.activeTimers[task.id] ? 'none' : 'inline';
            startBtn.addEventListener('click', () => this.startTimer(dayId, quadrantId, task.id));
            timerControls.appendChild(startBtn);
            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'task-btn btn-pause';
            pauseBtn.id = `pause-${task.id}`;
            pauseBtn.innerHTML = '&#10074;&#10074;';
            pauseBtn.title = 'Приостановить таймер';
            pauseBtn.style.display = this.activeTimers[task.id] ? 'inline' : 'none';
            pauseBtn.addEventListener('click', () => this.pauseTimer(dayId, quadrantId, task.id));
            timerControls.appendChild(pauseBtn);
            const timeBtn = document.createElement('button');
            timeBtn.className = 'task-btn btn-set-time';
            timeBtn.innerHTML = '&#x1F551;';
            timeBtn.title = 'Установить запланированное время';
            timeBtn.addEventListener('click', () => this.setTaskPlannedTime(dayId, quadrantId, task.id));
            timerControls.appendChild(timeBtn);
            const deadlineBtn = document.createElement('button');
            deadlineBtn.className = 'task-btn btn-deadline';
            deadlineBtn.innerHTML = '&#x1F4C5;';
            deadlineBtn.title = 'Установить дедлайн';
            deadlineBtn.addEventListener('click', () => this.setTaskDeadline(dayId, quadrantId, task.id));
            timerControls.appendChild(deadlineBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-btn btn-delete';
            deleteBtn.innerHTML = '&#x2715;';
            deleteBtn.title = 'Удалить задачу';
            deleteBtn.addEventListener('click', () => this.deleteTask(dayId, quadrantId, task.id));
            timerControls.appendChild(deleteBtn);
            taskActions.appendChild(timerControls);
            taskItem.appendChild(taskActions);
            taskList.appendChild(taskItem);
            if (this.activeTimers[task.id]) {
                timerDisplay.classList.add('timer-active');
            }
        });
    }
    setupDayTabs() {
        const dayTabs = document.querySelectorAll('.day-tab');
        dayTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dayTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.day-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const dayId = tab.getAttribute('data-day');
                document.getElementById(`content-${dayId}`).classList.add('active');
            });
        });
    }
    renderAllTasks() {
        this.days.forEach(day => {
            this.quadrants.forEach(quadrant => {
                this.renderTasks(day.id, quadrant.id);
            });
        });
    }
    checkDeadlines() {
        this.days.forEach(day => {
            this.quadrants.forEach(quadrant => {
                if (this.tasks[day.id] && this.tasks[day.id][quadrant.id]) {
                    this.tasks[day.id][quadrant.id].forEach(task => {
                        if (task.startDeadline && task.endDeadline) {
                            const deadlineDisplay = document.getElementById(`deadline-${task.id}`);
                            if (deadlineDisplay) {
                                deadlineDisplay.textContent = this.formatDeadline(task.startDeadline, task.endDeadline);
                                deadlineDisplay.className = `deadline-display ${this.getDeadlineClass(task.startDeadline, task.endDeadline)}`;
                            }
                        }
                    });
                }
            });
        });
    }
}
class StorageManager {
    static downloadData() {
        try {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                try {
                    data[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    data[key] = localStorage.getItem(key);
                }
            }
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tasks_backup_' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading data:', error);
            alert('Произошла ошибка при скачивании данных');
        }
    }
    static uploadData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('Это действие перезапишет все существующие данные. Продолжить?')) {
                    localStorage.clear();
                    for (const key in data) {
                        if (typeof data[key] === 'object' && data[key] !== null) {
                            localStorage.setItem(key, JSON.stringify(data[key]));
                        } else {
                            localStorage.setItem(key, data[key]);
                        }
                    }
                    alert('Данные успешно загружены');
                    location.reload();
                }
            } catch (error) {
                console.error('Error uploading data:', error);
                alert('Произошла ошибка при загрузке данных. Убедитесь, что файл имеет правильный формат.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}
window.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
    document.getElementById('downloadData').addEventListener('click', StorageManager.downloadData);
    document.getElementById('uploadData').addEventListener('change', StorageManager.uploadData);
});
