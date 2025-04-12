class Socket {
	static SOCKET_URL = 'wss://fly-allowing-oddly.ngrok-free.app';

	constructor(teamsData) {
		this.teamsData = teamsData;
		this.socket = null;
		this.isLocal = true;
		this.wsUrl = (this.isLocal ? 'ws://localhost:8080' : Socket.SOCKET_URL) + '/ws/websocket';
		this.isGamePlaying = true;
		this.gameEndTimeout = -1;

		this.#initSocketEvents();
	}

	startCountdown () {
		let count = 120;
		const countdownEl = document.getElementById('countdown');
		countdownEl.classList.remove('hide');
		countdownEl.textContent = count;
		TEAMS_DATA.started = true;

		const total = count;

		const interval = setInterval(() => {
			count--;
			
			if (count === 0) {
				countdownEl.classList.add('hide');
				showSweetAlert(this.teamsData.count.red > this.teamsData.count.blue ? 'red' : this.teamsData.count.red < this.teamsData.count.blue ? 'blue' : 'tie');
				this.gameEndTimeout = -1;
				TEAMS_DATA.started = false;
				clearInterval(interval);
			} else {
				const progress = (total - count) / total;
				const red = 255;
				const green = Math.floor(255 - (255 - 100) * progress);
				const blue = Math.floor(255 - (255 - 100) * progress);
				countdownEl.style.color = `rgb(${red}, ${green}, ${blue})`;

				countdownEl.textContent = count;
				countdownEl.style.animation = 'none';
				countdownEl.offsetHeight;
				countdownEl.style.animation = '';
			}
		}, 1000);
	}

	#initSocketEvents() {
		this.socket = new WebSocket(this.wsUrl);
		const stompClient = Stomp.over(this.socket);

		stompClient.connect(
			{},
			(frame) => {
				stompClient.subscribe("/topic/team-updates", (message) => {
					try {
						const teamUpdate = JSON.parse(message.body);

						if (this.gameEndTimeout == -1 && teamUpdate.tapCount && teamUpdate.tapCount != 0) {
							console.log(true);
							this.startCountdown();
							this.gameEndTimeout = 0;
						}

						if (teamUpdate.tapCount !== undefined && teamUpdate.teamName) {
							if (teamUpdate.teamName === "Team Blue") {
								this.teamsData.count.blue = teamUpdate.tapCount;
							} else if (teamUpdate.teamName === "Team Red") {
								this.teamsData.count.red = teamUpdate.tapCount;
							}

							this.updateProgressBar();
						}

						if (teamUpdate.message) {
							if (teamUpdate.message.includes("Game created with team size")) {
								const newSize = parseInt(teamUpdate.message.split("size ")[1]);

								if (!isNaN(newSize)) {
									teamMembersCount = newSize;
									isGameCreated = true;
									blueTapCount = 0;
									redTapCount = 0;
									this.updateProgressBar();
								}
							}

							if (teamUpdate.message.includes("Game has been reset")) {
								this.resetGame();
							}
						}
					} catch (error) {
						console.error("Error processing WebSocket message:", error);
					}
				});
				stompClient.send("/app/get-team-counts", {}, JSON.stringify({}));
			},
			function (error) {
				console.error(error);
				setTimeout(this.#initSocketEvents, 5000);
			}
		);
	}

	updateProgressBar () {
		const bc = this.teamsData.count.blue;
		const rc = this.teamsData.count.red;
		percentageBlue.style.width = `calc(${bc * 100 / (bc + rc)}% - 0.2rem)`;
		percentageRed.style.width = `calc(${rc * 100 / (bc + rc)}% - 0.2rem)`;
		console.log("Updating progress bar...");
	}

	resetGame() {
		console.log("Game has been reset");
	}
}
