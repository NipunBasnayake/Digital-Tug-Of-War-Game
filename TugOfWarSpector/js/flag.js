class FlagEdge {
	constructor (a, b) {
		this.a = a;
		this.b = b;
		this.len = Vector.dist(a.position, b.position);
	}

	update () {
		const len = Vector.dist(this.a.position, this.b.position);
		const delta = len - this.len;
		const diff = Vector.sub(this.a.position, this.b.position);
		const norm  = Vector.normalize(diff);
		
		if (!this.a.fixed) this.a.position = Vector.add(this.a.position, Vector.scale(norm, -delta * 0.5));
		if (!this.b.fixed) this.b.position = Vector.add(this.b.position, Vector.scale(norm, delta * 0.5));
	}
}

class FlagVertex {
	constructor (x, y) {
		this.position = new Vector(x, y);
		this.oldPosition = this.position;
		this.fixed = false;
	}

	update (force) {
		if (this.fixed) return;

		const velocity = Vector.sub(this.position, this.oldPosition);
		const newPosition = Vector.add(force, Vector.add(this.position, velocity));

		this.oldPosition = this.position;
		this.position = newPosition;
	}
}

class Flag {
	constructor () {
		this.cols = 20;
		this.rows = 12;
		this.vertises = [];
		this.edges = [];
		this.force = new Vector(0.002, 0);
		this.counter = 0;
		this.speed = 1;
		this.forceCounter = 0;
		this.forceSpeed = 1000;

		this.colors = ['#fff', '#000', '#88f', '#8f8'];
		this.colorArray = [
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 1, 1, 1, 1, 0, 2, 2, 2, 2, 0, 1, 1, 1, 1, 1, 0, 0],
			[0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 1, 0, 1, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 1, 0, 1, 1, 1, 1, 0, 2, 2, 2, 2, 0, 0, 0, 1, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		];

		for (let a = 0; a < this.rows; a++) {
			this.#genarteLine(a);
		}

		for (let a = 0; a < this.cols; a++) {
			for (let b = 0; b < this.rows - 1; b++) {
				this.edges.push(new FlagEdge(this.vertises[b * this.cols + a], this.vertises[(b + 1) * this.cols + a]));
			}
		}

		this.vertises[0].fixed = true;
		this.vertises[this.cols * (Math.floor(this.rows * 0.5) - 1)].fixed = true;
		this.vertises[this.cols * (this.rows - 1)].fixed = true;
	}

	#genarteLine (y) {
		const tempVertises = [];

		for (let a = 0; a < this.cols; a++) {
			const vertex = new FlagVertex(a, y);

			this.vertises.push(vertex);
			tempVertises.push(vertex);
		}

		for (let a = 0; a < this.cols - 1; a++) {
			this.edges.push(new FlagEdge(tempVertises[a], tempVertises[a + 1]));
		}
	}

	draw (ctx, x, y, w, h, bean) {
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 4;
		
		ctx.beginPath();
		ctx.moveTo(x, y - bean);
		ctx.lineTo(x, y + h);
		ctx.stroke();

		ctx.fillStyle = '#0007';

		ctx.beginPath();
		ctx.ellipse(x, y + h, 20, 10, 0, 0, Math.PI * 2);
		ctx.fill();

		const cw = w / this.cols;
		const ch = h / this.rows;
		const fy = y - bean;
		
		for (let row = 0; row < this.rows - 1; row++) {
			for (let col = 0; col < this.cols - 1; col++) {
				const i = row * this.cols + col;
		
				const color = this.colors[this.colorArray[row][col]];
				const topLeft = this.vertises[i];
				const topRight = this.vertises[i + 1];
				const bottomLeft = this.vertises[i + this.cols];
				const bottomRight = this.vertises[i + this.cols + 1];

				ctx.fillStyle = color;
		
				ctx.beginPath();
				ctx.moveTo(x + topLeft.position.x * cw, fy + topLeft.position.y * ch);
				ctx.lineTo(x + topRight.position.x * cw, fy + topRight.position.y * ch);
				ctx.lineTo(x + bottomRight.position.x * cw, fy + bottomRight.position.y * ch);
				ctx.lineTo(x + bottomLeft.position.x * cw, fy + bottomLeft.position.y * ch);
				ctx.closePath();
				ctx.fill();
			}
		}
	}

	updateForce () {
		this.forceCounter++;

		if (this.forceCounter < this.forceSpeed) return;

		this.forceCounter = 0;

		const newSpeed = Math.random() * 2 - 1;
		const sign = Math.sign(newSpeed);

		this.force.x = Math.max(Math.abs(newSpeed), 0.2) * sign * 0.008;
	}

	update () {
		this.counter++;

		if (this.counter < this.speed) return;

		this.updateForce();
		
		this.counter = 0;
		this.vertises.forEach(vertex => vertex.update(this.force));
		this.edges.forEach(edge => edge.update());
	}
}
