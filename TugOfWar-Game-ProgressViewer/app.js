const WS_URL = "fly-allowing-oddly.ngrok-free.app";
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
const teamsImage = document.getElementById("teamsImage");
const rope = document.querySelector(".rope");

// Game State Variables
let teamMembersCount = 0;
let isGameCreated = false;
let blueTapCount = 0;
let redTapCount = 0;
let stompClient = null;
let gameActive = true;

// Image Movement Variables
let currentImagePosition = 0;
const maxImageMovement = 200;
const imageMovementSpeed = 5;

// Load SweetAlert2 library
const sweetAlertScript = document.createElement('script');
sweetAlertScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
document.head.appendChild(sweetAlertScript);

// ================= KEY TESTING FUNCTIONS =================
function setupTestControls() {
    document.addEventListener('keydown', function(event) {
        if (!gameActive) return;
        
        // Left arrow - Add blue taps
        if (event.key === 'ArrowLeft') {
            blueTapCount += 5;
            updateProgressBar();
        }
        // Right arrow - Add red taps
        else if (event.key === 'ArrowRight') {
            redTapCount += 5;
            updateProgressBar();
        }
        // Space - Reset counts
        else if (event.key === ' ') {
            blueTapCount = 0;
            redTapCount = 0;
            updateProgressBar();
        }
        // B - Force blue win (for testing)
        else if (event.key === 'b' || event.key === 'B') {
            blueTapCount = 100;
            redTapCount = 10;
            updateProgressBar();
        }
        // R - Force red win (for testing)
        else if (event.key === 'r' || event.key === 'R') {
            redTapCount = 100;
            blueTapCount = 10;
            updateProgressBar();
        }
    });
}


function showSweetAlert(winner) {
    const winnerTeam = winner === 'blue' ? 'Blue' : 'Red';
    const backgroundColor = winner === 'blue' ? '#044C91' : '#8D153A';
    const textColor = '#FFFFFF';
    
    // Make sure SweetAlert2 is loaded
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 not loaded yet. Falling back to basic alert.');
        alert(`Congratulations Team ${winnerTeam}! Your team winned!`);
        return;
    }
    
    // Create a trophy icon in SVG format with the winner's color
    const trophySvg = `
    <img src="assets/trophy-star.png" width="100" height="100" style="filter: ${winner === 'blue' ? 'hue-rotate(200deg)' : winner === 'red' ? 'hue-rotate(0deg)' : 'hue-rotate(120deg)'}" />
`;
    
    // Display the SweetAlert with animation
    Swal.fire({
        title: `Congratulations Team ${winnerTeam}!`,
        html: `
            <div style="margin-bottom: 15px;">${trophySvg}</div>
            <p style="font-size: 24px; margin: 20px 0;">Your team winned!</p>
        `,
        icon: 'success',
        confirmButtonText: 'Restart Game',
        allowOutsideClick: false,
        background: '#fff',
 
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        },
        customClass: {
            title: `winner-title-${winner}`,
            confirmButton: `winner-button-${winner}`
        }
    }).then((result) => {
        if (result.isConfirmed) {
            resetGame();
        }
    });
    
    // Add custom styles for the SweetAlert
    const style = document.createElement('style');
    style.textContent = `
        .winner-title-${winner} {
            color: ${backgroundColor} !important;
            font-size: 32px !important;
        }
        .winner-button-${winner} {
            background-color: ${backgroundColor} !important;
            color: ${textColor} !important;
        }
        .swal2-icon.swal2-success {
            border-color: ${backgroundColor} !important;
            color: ${backgroundColor} !important;
        }
        .swal2-icon.swal2-success [class^=swal2-success-line] {
            background-color: ${backgroundColor} !important;
        }
        .swal2-icon.swal2-success .swal2-success-ring {
            border-color: ${backgroundColor} !important;
        }
    `;
    document.head.appendChild(style);
    
    // Add animation stylesheet if not already present
    if (!document.querySelector('link[href*="animate.min.css"]')) {
        const animateCSS = document.createElement('link');
        animateCSS.rel = 'stylesheet';
        animateCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
        document.head.appendChild(animateCSS);
    }
    
    gameActive = false;
}

function resetGame() {
    blueTapCount = 0;
    redTapCount = 0;
    currentImagePosition = 0;
    gameActive = true;
    
    // Reset visual elements
    teamsImage.style.transform = 'translateX(0)';
    if (rope) rope.style.transform = 'translateX(0)';
    
    // Send reset command to server if needed
    if (stompClient && stompClient.connected) {
        stompClient.send("/app/reset-game", {}, JSON.stringify({}));
    }
    
    updateProgressBar();
}

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

function updateImagePosition(dividerPosition) {
    if (!gameActive) return;
    
    const percentage = dividerPosition / 100;
    const targetPosition = (0.5 - percentage) * (maxImageMovement * 2);
    
    currentImagePosition += (targetPosition - currentImagePosition) / imageMovementSpeed;
    
    teamsImage.style.transform = `translateX(${currentImagePosition}px)`;
    if (rope) {
        rope.style.transform = `translateX(${currentImagePosition}px)`;
    }
}

function updateProgressBar() {
    const gameState = calculateGameState();

    blueTapCountElement.textContent = blueTapCount;
    redTapCountElement.textContent = redTapCount;

    blueSideElement.style.width = `${gameState.dividerPosition}%`;
    redSideElement.style.width = `${100 - gameState.dividerPosition}%`;

    updateImagePosition(gameState.dividerPosition);

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
        
        if (gameActive) {
            showSweetAlert(gameState.winner);
        }
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

                    console.log(teamUpdate);
                    

                    if (teamUpdate.tapCount !== undefined && teamUpdate.teamName && gameActive) {
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
                            resetGame();
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

document.addEventListener("DOMContentLoaded", function() {
    connectWebSocket();
    setupTestControls(); 
    updateImagePosition(50);
});

