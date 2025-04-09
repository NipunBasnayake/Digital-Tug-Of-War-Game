const WS_URL = "f2b9-157-157-116-180.ngrok-free.app";
const protocol = window.location.protocol;
const wsUrl = `${protocol === "https:" ? "wss:" : "ws:"}//${
  protocol === "https:" ? WS_URL : "localhost:8080"
}/ws/websocket`;

const connectionStatusElement = document.getElementById("connectionStatus");
const blueSideElement = document.getElementById("blueSide");
const redSideElement = document.getElementById("redSide");
const bluePercentageElement = document.getElementById("bluePercentage");
const redPercentageElement = document.getElementById("redPercentage");
const gameStatusElement = document.getElementById("gameStatus");
const winnerBannerElement = document.getElementById("winnerBanner");
const blueTapCountElement = document.getElementById("blueTapCount");
const redTapCountElement = document.getElementById("redTapCount");

let teamMembersCount = 0;
let isGameCreated = false;
let blueTapCount = 0;
let redTapCount = 0;
let stompClient = null;

function calculateGameState() {
  const minimumRequiredTaps = 50;
  const bothTeamsFull = true;

  const blueValidTaps = bothTeamsFull ? Math.max(0, blueTapCount - 20) : 0;
  const redValidTaps = bothTeamsFull ? Math.max(0, redTapCount - 20) : 0;
  const totalValidTaps = blueValidTaps + redValidTaps;

  let dividerPosition = 50;
  if (totalValidTaps > 0) {
    dividerPosition = (blueValidTaps / totalValidTaps) * 100;
  }

  const canWin = totalValidTaps >= minimumRequiredTaps;
  let winner = null;

  if (canWin) {
    if (dividerPosition >= 75) {
      winner = "blue";
    } else if (dividerPosition <= 25) {
      winner = "red";
    }
  }

  return {
    blueValidTaps,
    redValidTaps,
    totalValidTaps,
    dividerPosition,
    winner,
    canWin,
  };
}

function updateProgressBar() {
  const gameState = calculateGameState();

  blueTapCountElement.textContent = blueTapCount;
  redTapCountElement.textContent = redTapCount;

  blueSideElement.style.width = `${gameState.dividerPosition}%`;
  redSideElement.style.width = `${100 - gameState.dividerPosition}%`;

  if (gameState.totalValidTaps === 0) {
    bluePercentageElement.textContent = "50%";
    redPercentageElement.textContent = "50%";
  } else {
    bluePercentageElement.textContent = `${Math.round(
      (gameState.blueValidTaps / gameState.totalValidTaps) * 100
    )}%`;
    redPercentageElement.textContent = `${Math.round(
      (gameState.redValidTaps / gameState.totalValidTaps) * 100
    )}%`;
  }

  if (gameState.winner) {
    winnerBannerElement.style.display = "block";
    winnerBannerElement.textContent = `Winner: Team ${
      gameState.winner === "blue" ? "Blue" : "Red"
    }`;
    gameStatusElement.textContent = "Game Over";
  } else {
    winnerBannerElement.style.display = "none";
    gameStatusElement.textContent = isGameCreated
      ? "Game in Progress"
      : "Waiting for Game to Start";
  }
}

function connectWebSocket() {
  const socket = new WebSocket(wsUrl);
  stompClient = Stomp.over(socket);

  stompClient.connect(
    {},
    function (frame) {
      connectionStatusElement.textContent = "Connected to WebSocket";
      connectionStatusElement.style.backgroundColor = "#d4edda";
      connectionStatusElement.style.color = "#155724";

      stompClient.subscribe("/topic/team-updates", function (message) {
        try {
          const teamUpdate = JSON.parse(message.body);

          if (teamUpdate.tapCount !== undefined && teamUpdate.teamName) {
            if (teamUpdate.teamName === "Team Blue") {
              blueTapCount = teamUpdate.tapCount;
            } else if (teamUpdate.teamName === "Team Red") {
              redTapCount = teamUpdate.tapCount;
            }
            updateProgressBar();
          }

          if (teamUpdate.message) {
            if (teamUpdate.message.includes("Game created with team size")) {
              const newSize = parseInt(teamUpdate.message.split("size ")[1]);

              if (!isNaN(newSize)) {
                teamMembersCount = newSize;
                isGameCreated = true;
                blueTapCount = 0;
                redTapCount = 0;
                updateProgressBar();
              }
            }

            if (teamUpdate.message.includes("Game has been reset")) {
              isGameCreated = false;
              teamMembersCount = 0;
              blueTapCount = 0;
              redTapCount = 0;
              updateProgressBar();
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });
      stompClient.send("/app/get-team-counts", {}, JSON.stringify({}));
    },
    function (error) {
      console.error("STOMP connection error:", error);
      connectionStatusElement.textContent = "Connection Failed. Retrying...";
      connectionStatusElement.style.backgroundColor = "#f8d7da";
      connectionStatusElement.style.color = "#721c24";

      setTimeout(connectWebSocket, 5000);
    }
  );
}
connectWebSocket();
