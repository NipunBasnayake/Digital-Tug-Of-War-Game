class Cloud {
	constructor (texture, dencity) {
		this.texture = texture;
		this.clouds = [];

		this.#generateClouds(dencity);
	}

	#generateClouds (dencity) {
		for (let a = 0; a < dencity; a++) {
			const x = Math.random() * 2000 - 1000;
			const y = Math.random() * 400 - 50;
			const size = Math.random() * 0.5 + 0.5;
			const velocity = Math.random() - 0.5;

			this.clouds.push({ x, y, size, velocity });
		}
	}

	draw (ctx) {
		const tw = this.texture.width;
		const th = this.texture.height;

		this.clouds.forEach(cloud => ctx.drawImage(this.texture, cloud.x, cloud.y, cloud.size * tw, cloud.size * th));
	}

	update (width) {
		const tw = this.texture.width;

		this.clouds.forEach(cloud => {
			cloud.x += cloud.velocity;

			if (cloud.x + cloud.size * tw < 0 || cloud.x - cloud.size * tw > width) cloud.velocity *= -1;
		});
	}
}
