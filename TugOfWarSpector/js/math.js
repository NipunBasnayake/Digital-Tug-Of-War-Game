function lerp (min, max, t) {
	return min + (max - min) * t;
}

class Vector {
	constructor (x, y) {
		this.x = x;
		this.y = y;
	}

	static add (a, b) {
		return new Vector(a.x + b.x, a.y + b.y);
	}

	static sub (a, b) {
		return new Vector(a.x - b.x, a.y - b.y);
	}

	static scale (v, scaler) {
		return new Vector(v.x * scaler, v.y * scaler);
	}

	static mag (v) {
		return Math.hypot(v.x, v.y);
	}

	static  normalize (v) {
		return Vector.scale(v, 1 / Vector.mag(v));
	}

	static dist (a, b) {
		return Vector.mag(Vector.sub(a, b));
	}
}
