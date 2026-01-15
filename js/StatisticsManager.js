export default class StatisticsManager{
	constructor(storageManager){
		this.storageManager = storageManager;
		this.modal = document.getElementById('modal-statistics');
	}

	init(){
		document.getElementById('statistics-close').onclick = () => this.modal.close();
	}

	show(){
		const days = this.storageManager.storageJSON('days');
		const content = document.getElementById('statistics-content');
		content.replaceChildren();
		const taskStats = {};
		const collectTasks = (tasks) => {
			tasks.forEach(task => {
				const name = task.task.toLowerCase().trim();
				if(!taskStats[name]){
					taskStats[name] = {completed: 0, total: 0, displayName: task.task};
				}
				taskStats[name].total++;
				if(task.completed) taskStats[name].completed++;
				if(task.subtasks?.length) collectTasks(task.subtasks);
			});
		};
		for(let d = 0; d < 7; d++){
			if(days[d]){
				for(let col = 0; col < 4; col++){
					if(days[d][col]) collectTasks(days[d][col]);
				}
			}
		}
		const summaryDiv = document.createElement('div');
		summaryDiv.className = 'stat-summary';
		const summaryTitle = document.createElement('div');
		summaryTitle.className = 'stat-summary-title';
		summaryTitle.textContent = 'Общая сводка:';
		summaryDiv.append(summaryTitle);
		const sortedTasks = Object.values(taskStats).sort((a, b) => b.total - a.total);
		sortedTasks.forEach(stat => {
			const item = document.createElement('div');
			item.className = 'stat-summary-item';
			const name = document.createElement('span');
			name.textContent = stat.displayName;
			const countWrapper = document.createElement('span');
			const completedSpan = document.createElement('span');
			completedSpan.textContent = stat.completed;
			completedSpan.style.color = '#4CAF50';
			const separator = document.createElement('span');
			separator.textContent = ' / ';
			separator.style.color = '#fff';
			const notCompleted = stat.total - stat.completed;
			const pendingSpan = document.createElement('span');
			pendingSpan.textContent = notCompleted;
			pendingSpan.style.color = '#f44336';
			countWrapper.append(completedSpan, separator, pendingSpan);
			item.append(name, countWrapper);
			summaryDiv.append(item);
		});
		content.append(summaryDiv);
		this.modal.showModal();
	}
}
