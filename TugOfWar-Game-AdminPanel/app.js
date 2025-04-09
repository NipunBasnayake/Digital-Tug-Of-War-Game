const resetGameBtn = document.getElementById("resetGameBtn");
const createGameBtn = document.getElementById("createGameBtn");
const maxTeamSizeInput = document.getElementById("maxTeamSize");
const messageAlert = document.getElementById("messageAlert");
const errorAlert = document.getElementById("errorAlert");
const serverUrlInput = document.getElementById("serverUrl");
const currentTeamSizeElement = document.getElementById("currentTeamSize");
const blueTeamCountElement = document.getElementById("blueTeamCount");
const redTeamCountElement = document.getElementById("redTeamCount");
const gameStateIndicator = document.getElementById("gameStateIndicator");

let isLoading = false;
let stompClient = null;
let currentMaxTeamSize = 0;
let isGameCreated = false;

if (localStorage.getItem("serverUrl")) {
  serverUrlInput.value = localStorage.getItem("serverUrl");
}

serverUrlInput.addEventListener("change", () => {
  localStorage.setItem("serverUrl", serverUrlInput.value);
  setupWebSocketConnection();
});

function getBaseUrl() {
  let url = serverUrlInput.value.trim();
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
}

function showMessage(message, isError = false) {
  if (isError) {
    errorAlert.textContent = message;
    errorAlert.style.display = "block";
    messageAlert.style.display = "none";
  } else {
    messageAlert.textContent = message;
    messageAlert.style.display = "block";
    errorAlert.style.display = "none";
  }

  setTimeout(() => {
    if (isError) {
      errorAlert.style.display = "none";
    } else {
      messageAlert.style.display = "none";
    }
  }, 5000);
}

function setLoading(loading) {
  isLoading = loading;
  resetGameBtn.disabled = loading;
  createGameBtn.disabled = loading;
  serverUrlInput.disabled = loading;

  resetGameBtn.textContent = loading ? "Processing..." : "Reset Game";
  createGameBtn.textContent = loading ? "Creating..." : "Create New Game";
}

function updateGameStateIndicator() {
  if (isGameCreated && currentMaxTeamSize > 0) {
    gameStateIndicator.textContent = "Game Active - Players Can Join";
    gameStateIndicator.className = "game-state game-active";
  } else {
    gameStateIndicator.textContent = "Game Not Created - Players Cannot Join";
    gameStateIndicator.className = "game-state game-inactive";
  }
}

function setupWebSocketConnection() {
  if (stompClient) {
    try {
      stompClient.close();
    } catch (err) {
      console.error("Error closing existing WebSocket:", err);
    }
  }

  const baseUrl = getBaseUrl();
  const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws";

  try {
    const socket = new WebSocket(wsUrl);

    socket.onopen = function () {
      console.log("WebSocket connection established");
      fetchTeams();
      fetchGameState();
    };

    socket.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);

        if (data.teamCounts) {
          updateTeamCountsDisplay(data.teamCounts, currentMaxTeamSize);
        }

        if (data.message) {
          if (data.message.includes("Max team size updated to")) {
            const newSize = parseInt(data.message.split("to ")[1]);
            if (!isNaN(newSize)) {
              currentMaxTeamSize = newSize;
              currentTeamSizeElement.textContent = newSize;
              updateTeamCountsDisplay(data.teamCounts, newSize);
              isGameCreated = true;
              updateGameStateIndicator();
            }
          }

          if (data.message.includes("Game has been reset")) {
            if (currentMaxTeamSize === 0) {
              isGameCreated = false;
            }
            updateGameStateIndicator();
          }

          if (data.message.includes("Game created with team size")) {
            isGameCreated = true;
            const newSize = parseInt(data.message.split("size ")[1]);
            if (!isNaN(newSize)) {
              currentMaxTeamSize = newSize;
              currentTeamSizeElement.textContent = newSize;
            }
            updateGameStateIndicator();
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    socket.onerror = function (error) {
      console.error("WebSocket error:", error);
      showMessage(
        "WebSocket connection error. Please check your server URL.",
        true
      );
    };

    socket.onclose = function () {
      console.log("WebSocket connection closed");
    };

    stompClient = {
      socket: socket,
      close: function () {
        socket.close();
      },
      publish: function (destination, body) {
        if (socket.readyState === WebSocket.OPEN) {
          const frame = {
            command: "SEND",
            destination: destination,
            body: body,
          };
          socket.send(JSON.stringify(frame));
        }
      },
    };
  } catch (err) {
    console.error("Error setting up WebSocket:", err);
    showMessage(
      "Failed to establish WebSocket connection. Please check your server URL.",
      true
    );
  }
}

function updateTeamCountsDisplay(teamCounts, maxSize) {
  if (teamCounts) {
    const blueCount = teamCounts["Team Blue"] || 0;
    const redCount = teamCounts["Team Red"] || 0;

    blueTeamCountElement.textContent =
      maxSize > 0 ? `${blueCount}/${maxSize}` : `${blueCount}/0`;
    redTeamCountElement.textContent =
      maxSize > 0 ? `${redCount}/${maxSize}` : `${redCount}/0`;
  }
}

async function fetchTeams() {
  try {
    const baseUrl = getBaseUrl();

    const countsResponse = await fetch(`${baseUrl}/api/teams/team-members`);

    if (countsResponse.ok) {
      const countsData = await countsResponse.json();
      updateTeamCountsDisplay(countsData, currentMaxTeamSize);
    }
  } catch (err) {
    console.error("Error fetching teams:", err);
  }
}

async function fetchGameState() {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/game-state`);

    if (!response.ok) {
      isGameCreated = false;
      currentMaxTeamSize = 0;
      currentTeamSizeElement.textContent = "Not set";
      updateGameStateIndicator();
      return;
    }

    const data = await response.json();

    if (data.maxTeamSize) {
      currentMaxTeamSize = data.maxTeamSize;
      currentTeamSizeElement.textContent = data.maxTeamSize;
      maxTeamSizeInput.value = data.maxTeamSize;
    }

    isGameCreated = data.isGameCreated || false;

    updateGameStateIndicator();
  } catch (err) {
    console.error("Error fetching game state:", err);
    isGameCreated = false;
    currentMaxTeamSize = 0;
    currentTeamSizeElement.textContent = "Not set";
    updateGameStateIndicator();
  }
}

createGameBtn.addEventListener("click", async () => {
  if (isLoading) return;

  if (
    isGameCreated &&
    !confirm(
      "A game is already active. Creating a new game will reset the current one. Continue?"
    )
  ) {
    return;
  }

  const maxTeamSize = parseInt(maxTeamSizeInput.value) || 1;

  try {
    setLoading(true);
    messageAlert.style.display = "none";
    errorAlert.style.display = "none";

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/create-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxTeamSize: maxTeamSize,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create game");
    }

    const result = await response.json();
    currentMaxTeamSize = maxTeamSize;
    isGameCreated = true;

    currentTeamSizeElement.textContent = maxTeamSize;
    updateGameStateIndicator();

    showMessage(`Game created successfully with team size ${maxTeamSize}`);

    fetchTeams();

    setLoading(false);
  } catch (err) {
    console.error("Error creating game:", err);
    showMessage("Failed to create game. Please try again.", true);
    setLoading(false);
  }
});

resetGameBtn.addEventListener("click", async () => {
  if (isLoading) return;

  if (
    !confirm(
      "Are you sure you want to reset the game? This will remove all players and reset tap counts."
    )
  ) {
    return;
  }

  try {
    setLoading(true);
    messageAlert.style.display = "none";
    errorAlert.style.display = "none";

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/reset-game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to reset game");
    }

    await response.json();

    isGameCreated = false;

    updateGameStateIndicator();

    showMessage("Game reset successfully");

    fetchTeams();

    setLoading(false);
  } catch (err) {
    console.error("Error resetting game:", err);
    showMessage("Failed to reset game. Please try again.", true);
    setLoading(false);
  }
});

maxTeamSizeInput.addEventListener("input", () => {
  let value = parseInt(maxTeamSizeInput.value) || 1;
  if (value < 1) value = 1;
  if (value > 20) value = 20;
  maxTeamSizeInput.value = value;
});

document.addEventListener("DOMContentLoaded", () => {
  setupWebSocketConnection();
});
