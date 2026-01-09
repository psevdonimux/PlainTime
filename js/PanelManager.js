export default class PanelManager{

	constructor(storageManager, updateAllTaskLists){
		this.storageManager = storageManager;
		this.updateAllTaskLists = updateAllTaskLists; 
		this.currentDay = new Date().getDay();
    }

	getCurrentTaskDay(){
		return this.currentDay;
	}

	setCurrentTaskDay(day){
		this.currentDay = day;
		this.updateAllTaskLists(day);
	}

	updateDays(e){
		let clickedIndex = Array.from(e.target.closest('#panel').querySelectorAll('.days')).indexOf(e.target);
		clickedIndex = clickedIndex == 6 ? 0 : ++clickedIndex;
		this.setCurrentTaskDay(clickedIndex);
		document.querySelectorAll('.days').forEach(btn => {
			btn.style.color = 'gray';
		});
		e.target.style.color = 'var(--text-color)';
	}

	getNearestMondayToSundayRange(){
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

	handleExport(){
		let days = this.getNearestMondayToSundayRange();
		const link = document.createElement('a');
		link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(days));
		link.download = days;
		const jsonString = JSON.stringify(this.storageManager.storageJSON('days'), null, 2);
		const blob = new Blob([jsonString], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		link.href = url;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	handleImport(e){
		const reader = new FileReader();
		reader.onload = (event) => {
			const dataFromFile = JSON.parse(event.target.result);
			this.storageManager.storageJSON("days", dataFromFile);
			this.updateAllTaskLists();
		};
		reader.readAsText(e.target.files[0]);
		e.target.value = "";
	}
}