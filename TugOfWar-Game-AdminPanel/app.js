// // Game Admin Panel JavaScript
let isLoading = false;
let stompClient = null;
let currentMaxTeamSize = 0;
let isGameCreated = false;

// Get DOM elements
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

function getBaseUrl() {
    let url = serverUrlInput.value.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "http://" + url;
    }
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    return url;
}

function getWebSocketUrl() {
    const baseUrl = getBaseUrl();
    return baseUrl.replace(/^http/, "ws") + "/ws/websocket";
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

// Set loading state
function setLoading(loading) {
    isLoading = loading;
    resetGameBtn.disabled = loading;
    createGameBtn.disabled = loading;
    serverUrlInput.disabled = loading;

    resetGameBtn.textContent = loading ? "Processing..." : "Reset Game";
    createGameBtn.textContent = loading ? "Creating..." : "Create New Game";
}

// Update game state indicator
function updateGameStateIndicator() {
    if (isGameCreated && currentMaxTeamSize > 0) {
        gameStateIndicator.textContent = "Game Active - Players Can Join";
        gameStateIndicator.className = "game-state game-active";
    } else {
        gameStateIndicator.textContent = "Game Not Created - Players Cannot Join";
        gameStateIndicator.className = "game-state game-inactive";
    }
}

// Setup WebSocket connection
function setupWebSocketConnection() {
    if (stompClient) {
        try {
            stompClient.deactivate();
        } catch (err) {
            console.error("Error closing existing WebSocket:", err);
        }
    }

    const wsUrl = getWebSocketUrl();

    try {
        const client = new StompJs.Client({
            brokerURL: wsUrl,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: function(str) {
                console.log(str);
            }
        });

        client.onConnect = function(frame) {
            console.log("WebSocket connection established");
            
            // Subscribe to team updates
            client.subscribe('/topic/team-updates', function(message) {
                try {
                    const data = JSON.parse(message.body);

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
                                showMessage(`Team size updated to ${newSize}`);
                            }
                        }

                        if (data.message.includes("Game has been reset")) {
                            if (currentMaxTeamSize === 0) {
                                isGameCreated = false;
                            }
                            updateGameStateIndicator();
                            showMessage("Game has been reset");
                        }

                        if (data.message.includes("Game created with team size")) {
                            isGameCreated = true;
                            const newSize = parseInt(data.message.split("size ")[1]);
                            if (!isNaN(newSize)) {
                                currentMaxTeamSize = newSize;
                                currentTeamSizeElement.textContent = newSize;
                                maxTeamSizeInput.value = newSize;
                            }
                            updateGameStateIndicator();
                            showMessage(`Game created with team size ${newSize}`);
                        }
                    }
                } catch (err) {
                    console.error("Error processing WebSocket message:", err);
                }
            });

            // Fetch initial data
            fetchGameState();
            fetchTeamMembers();
        };

        client.onStompError = function(frame) {
            console.error("Broker reported error: " + frame.headers["message"]);
            showMessage(
                "WebSocket connection error. Please check your server URL.",
                true
            );
        };

        client.onWebSocketError = function(error) {
            console.error("WebSocket connection error:", error);
            showMessage(
                "WebSocket connection error. Please check your server URL.",
                true
            );
        };

        client.activate();
        stompClient = client;
    } catch (err) {
        console.error("Error setting up WebSocket:", err);
        showMessage(
            "Failed to establish WebSocket connection. Please check your server URL.",
            true
        );
    }
}

// Update team counts display
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

// Fetch team members
async function fetchTeamMembers() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/admin/players`);

        if (!response.ok) {
            throw new Error("Failed to fetch team members");
        }

        const text = await response.text();

        if (text[0] === "<") {
            // console.log("Response is HTML, indicating an error or unexpected response format.");
            console.log(text);
            
            return
        }

        const data = JSON.parse(text);
        
        // Calculate counts from the members data
        const blueCount = data["Team Blue"] ? data["Team Blue"].filter(Boolean).length : 0;
        const redCount = data["Team Red"] ? data["Team Red"].filter(Boolean).length : 0;
        
        updateTeamCountsDisplay({
            "Team Blue": blueCount,
            "Team Red": redCount
        }, currentMaxTeamSize);
    } catch (err) {
        console.error("Error fetching team members:", err);
    }
}

// Fetch game state
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

// Create game event listener
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
            body: JSON.stringify({ maxTeamSize }),
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

        // Publish to WebSocket to notify all clients
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: "/app/admin/update",
                body: JSON.stringify({
                    message: `Game created with team size ${maxTeamSize}`,
                    maxTeamSize: maxTeamSize,
                    isGameCreated: true
                })
            });
        }

        fetchTeamMembers();
        setLoading(false);
    } catch (err) {
        console.error("Error creating game:", err);
        showMessage("Failed to create game. Please try again.", true);
        setLoading(false);
    }
});

// Reset game event listener
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

        // Publish to WebSocket to notify all clients
        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: "/app/admin/update",
                body: JSON.stringify({
                    message: "Game has been reset",
                    isGameCreated: false
                })
            });
        }

        fetchTeamMembers();
        setLoading(false);
    } catch (err) {
        console.error("Error resetting game:", err);
        showMessage("Failed to reset game. Please try again.", true);
        setLoading(false);
    }
});

// Validate max team size input
maxTeamSizeInput.addEventListener("input", () => {
    let value = parseInt(maxTeamSizeInput.value) || 1;
    if (value < 1) value = 1;
    if (value > 20) value = 20;
    maxTeamSizeInput.value = value;
});

// Reconnect when server URL changes
serverUrlInput.addEventListener("change", () => {
    setupWebSocketConnection();
});

// Initialize WebSocket connection when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load StompJS library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js';
    script.onload = setupWebSocketConnection;
    document.head.appendChild(script);
});