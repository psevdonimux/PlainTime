export default class WallpaperManager{
	constructor(storageManager){
		this.storageManager = storageManager;
		this.modal = document.getElementById('modal-wallpaper');
		this.wallpaperInput = document.getElementById('wallpaperInput');
	}
	init(){
		this.loadWallpaper();
		document.getElementById('wallpaper').onclick = () => this.modal.showModal();
		document.getElementById('wallpaper-close').onclick = () => this.modal.close();
		document.getElementById('wallpaper-upload').onclick = () => this.wallpaperInput.click();
		document.getElementById('wallpaper-download').onclick = () => this.downloadWallpaper();
		document.getElementById('wallpaper-random').onclick = () => this.setRandomWallpaper();
		document.getElementById('wallpaper-reset').onclick = () => this.resetWallpaper();
		this.wallpaperInput.onchange = e => this.uploadWallpaper(e);
	}
	loadWallpaper(){
		const wallpaper = this.storageManager.storage('wallpaper');
		if(wallpaper) document.body.style.backgroundImage = `url(${wallpaper})`;
	}
	uploadWallpaper(e){
		const file = e.target.files[0];
		if(!file) return;
		const reader = new FileReader();
		reader.onload = ev => {
			const data = ev.target.result;
			this.storageManager.storage('wallpaper', data);
			document.body.style.backgroundImage = `url(${data})`;
			this.modal.close();
		};
		reader.readAsDataURL(file);
		e.target.value = '';
	}
	downloadWallpaper(){
		const wallpaper = this.storageManager.storage('wallpaper');
		if(!wallpaper) return alert('Нет сохранённых обоев');
		const link = document.createElement('a');
		link.href = wallpaper;
		link.download = 'wallpaper.png';
		link.click();
	}
	setRandomWallpaper(){
		const img = new Image();
		img.src = 'https://picsum.photos/1000?random=' + Date.now();
		img.crossOrigin = 'Anonymous';
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext('2d').drawImage(img, 0, 0);
			const dataURL = canvas.toDataURL();
			this.storageManager.storage('wallpaper', dataURL);
			document.body.style.backgroundImage = `url(${dataURL})`;
			this.modal.close();
		};
	}
	resetWallpaper(){
		this.storageManager.storage('wallpaper', null);
		document.body.style.backgroundImage = '';
		this.modal.close();
	}
}
