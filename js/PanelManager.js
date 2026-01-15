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
		let idx = [...e.target.closest('#panel').querySelectorAll('.days')].indexOf(e.target);
		this.setCurrentTaskDay(idx === 6 ? 0 : ++idx);
		document.querySelectorAll('.days').forEach(btn => btn.style.color = 'gray');
		e.target.style.color = 'var(--text-color)';
	}
	getNearestMondayToSundayRange(){
		const today = new Date();
		const day = today.getDay();
		const monday = new Date(today);
		monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);
		const fmt = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
		return `${fmt(monday)}-${fmt(sunday)}_PlainTime`;
	}
	handleExport(){
		const name = this.getNearestMondayToSundayRange();
		const blob = new Blob([JSON.stringify(this.storageManager.storageJSON('days'), null, 2)], {type: 'application/json'});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
	handleImport(e){
		const reader = new FileReader();
		reader.onload = ev => {
			this.storageManager.storageJSON('days', JSON.parse(ev.target.result));
			this.updateAllTaskLists();
		};
		reader.readAsText(e.target.files[0]);
		e.target.value = '';
	}
}
