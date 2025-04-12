const ctx = canvas.getContext('2d');
const cloud = new Cloud(TEXTURES.cloud, 10);
const flag = new Flag();
const TEAMS_DATA = {
	count: {
		red: 0,
		blue: 0
	},
	started: false
};
let keyMove = false;

const socket = new Socket(TEAMS_DATA);

let width = 0;
let height = 0;
let teamsPositionX = 0;

function drawTeams () {
	const sprite = SPRITES.teams;
	const frameWidth = sprite.width / sprite.frames;
	const targetHeight = 200;
	const aspectRatio = frameWidth / sprite.height;
	const targetWidth = targetHeight * aspectRatio;
	const offsetY = 50;

	const x = (width - targetWidth) / 2 + teamsPositionX;
	const y = height - targetHeight - offsetY;

	ctx.drawImage(sprite.img, sprite.frame * frameWidth, 0, frameWidth, sprite.height, x, y, targetWidth, targetHeight);
}

function drawFlag () {
	const flagWidth = 100;
	const flagHeight = 150;
	const bean = 200;
	const offsetY = 80;

	const x = width * 0.5;
	const y = height - flagHeight - offsetY;

	flag.draw(ctx, x, y, flagWidth, flagHeight, bean);
}

function drawSun () {
	const img = TEXTURES.sun;
	const iw = img.width;
	const ih = img.height;
	const w = 300;
	const h = w * ih / iw;
	const x = 20;
	const y = 200;
	const angle = performance.now() / 8000;

	ctx.save();
	ctx.translate(x + w / 2, y + h / 2);
	ctx.rotate(angle);
	ctx.drawImage(img, -w / 2, -h / 2, w, h);
	ctx.restore();
}

function drawBackground () {
	const img = TEXTURES.background;
	const imgRatio = img.width / img.height;
	const canvasRatio = width / height;

	let drawWidth;
	let drawHeight;

	if (canvasRatio > imgRatio) {
		drawWidth = width;
		drawHeight = width / imgRatio;
	} else {
		drawHeight = height;
		drawWidth = height * imgRatio;
	}

	const x = (width - drawWidth) / 2;
	const y = (height - drawHeight) / 2;

	ctx.drawImage(img, x, y, drawWidth, drawHeight);
}

function updateSprite (sprite) {
	sprite.counter++;

	if (sprite.counter == sprite.speed) {
		sprite.counter = 0;

		sprite.frame++;

		if (sprite.frame == sprite.frames) sprite.frame = 0;
	}
}

function updateTeamPosition () {
	if (TEAMS_DATA.count.blue == 0 && TEAMS_DATA.count.red == 0) {
		teamsPositionX = 0;
		return;
	}

	const blueScore = TEAMS_DATA.count.blue ** 1.2;
	const redScore = TEAMS_DATA.count.red ** 1.2;
	const percentage = (redScore - blueScore) * 0.003;

	teamsPositionX = width * percentage;
}

function updateFlag () {
	flag.update();
}

function draw () {
	ctx.clearRect(0, 0, width, height);
	drawBackground();
	drawSun();
	cloud.draw(ctx);
	drawFlag();
	drawTeams();
}

function update () {
	cloud.update(width);
	updateFlag();
	
	if (TEAMS_DATA.started) updateSprite(SPRITES.teams);

	updateTeamPosition();
}

function animate () {
	update();
	draw();
	window.requestAnimationFrame(animate);
}

function resize () {
	width = window.innerWidth;
	height = window.innerHeight;

	canvas.width = width;
	canvas.height = height;
}

function init () {
	animate();
	resize();

	window.addEventListener('resize', resize);
}

window.addEventListener('load', init);

window.addEventListener('keydown', event => {
	if (!keyMove) return;

	if (event.key == 'ArrowLeft') {
		TEAMS_DATA.count.blue++;
		socket.updateProgressBar();
	}

	if (event.key == 'ArrowRight') {
		TEAMS_DATA.count.red++;
		socket.updateProgressBar();
	}
});

window.addEventListener('dblclick', () => {
	console.log(`left click to ${keyMove ? 'disable' : 'enable'} key moves`);
	
	window.addEventListener('contextmenu', event => {
		event.preventDefault();
		keyMove = !keyMove;
		console.log(`Key moves ${keyMove ? 'enabled' : 'disabled'}`);
	}, { once: true });
});

window.addEventListener('click', () => {
	// socket.startCountdown();
});
