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
		const collectTasks = tasks => {
			for(const task of tasks){
				const name = task.task.toLowerCase().trim();
				taskStats[name] ??= {completed: 0, total: 0, displayName: task.task};
				taskStats[name].total++;
				if(task.completed) taskStats[name].completed++;
				if(task.subtasks?.length) collectTasks(task.subtasks);
			}
		};
		for(let d = 0; d < 7; d++){
			if(!days[d]) continue;
			for(let col = 0; col < 4; col++){
				if(days[d][col]) collectTasks(days[d][col]);
			}
		}
		const summaryDiv = document.createElement('div');
		summaryDiv.className = 'stat-summary';
		const summaryTitle = document.createElement('div');
		summaryTitle.className = 'stat-summary-title';
		summaryTitle.textContent = 'Общая сводка:';
		summaryDiv.append(summaryTitle);
		Object.values(taskStats).sort((a, b) => b.total - a.total).forEach(stat => {
			const item = document.createElement('div');
			item.className = 'stat-summary-item';
			const name = document.createElement('span');
			name.textContent = stat.displayName;
			const countWrapper = document.createElement('span');
			countWrapper.innerHTML = `<span style="color:#4CAF50">${stat.completed}</span><span style="color:#fff"> / </span><span style="color:#f44336">${stat.total - stat.completed}</span>`;
			item.append(name, countWrapper);
			summaryDiv.append(item);
		});
		content.append(summaryDiv);
		this.modal.showModal();
	}
}
