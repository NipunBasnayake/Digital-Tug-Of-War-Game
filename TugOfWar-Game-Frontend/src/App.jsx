// Import required dependencies
import React, { useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {
  const WS_URL = "8c0c-175-157-250-151.ngrok-free.app";
  const teamMembersCount = 2;

  // State management for user and connection
  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Team and game state management
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamTapCounts, setTeamTapCounts] = useState({
    "Team Blue": 0,
    "Team Red": 0,
  });
  const [teamCounts, setTeamCounts] = useState({
    "Team Blue": 0,
    "Team Red": 0,
  });
  const [lockStatus, setLockStatus] = useState({
    "Team Blue": false,
    "Team Red": false,
  });
  const [disabledButtons, setDisabledButtons] = useState({
    "Team Blue": false,
    "Team Red": false,
  });

  // Additional state for tap button cooldown
  const [lastTapTime, setLastTapTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTapping, setIsTapping] = useState(false);

  // Calculate game state based on the tug-of-war model
  const calculateGameState = () => {
    const minimumRequiredTaps = 50;
    const blueTaps = teamTapCounts["Team Blue"] || 0;
    const redTaps = teamTapCounts["Team Red"] || 0;

    // Check if teams are full
    const blueTeamCount = teamCounts["Team Blue"] || 0;
    const redTeamCount = teamCounts["Team Red"] || 0;
    const bothTeamsFull =
      blueTeamCount >= teamMembersCount && redTeamCount >= teamMembersCount;

    // Only count taps if both teams are full
    const blueValidTaps = bothTeamsFull ? Math.max(0, blueTaps - 20) : 0;
    const redValidTaps = bothTeamsFull ? Math.max(0, redTaps - 20) : 0;
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
  };

  // WebSocket and data fetching logic
  const fetchTapCounts = useCallback(async () => {
    try {
      const protocol = window.location.protocol;
      const response = await fetch(
        `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/api/teams/tap-counts`
      );

      if (!response.ok) {
        console.error("Failed to fetch tap counts");
        return;
      }
      const data = await response.json();
      setTeamTapCounts(data);
    } catch (error) {
      console.error("Error fetching tap counts:", error);
    }
  }, []);

  // WebSocket connection and event handling
  useEffect(() => {
    const protocol = window.location.protocol;

    const client = new Client({
      brokerURL: `${protocol === "https:" ? "wss:" : "ws:"}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/ws/websocket`,

      onConnect: () => {
        setIsConnected(true);

        client.subscribe("/topic/team-updates", (message) => {
          try {
            const teamUpdate = JSON.parse(message.body);

            if (teamUpdate.members) {
              setTeamMembers(teamUpdate.members);
            }

            if (teamUpdate.tapCount !== undefined) {
              if (teamUpdate.teamName) {
                setTeamTapCounts((prev) => ({
                  ...prev,
                  [teamUpdate.teamName]: teamUpdate.tapCount,
                }));
              }
            }

            if (teamUpdate.teamCounts) {
              setTeamCounts(teamUpdate.teamCounts);
            }

            if (teamUpdate.lockStatus) {
              setLockStatus(teamUpdate.lockStatus);
            }

            if (teamUpdate.message) {
              if (teamUpdate.message === "Team is full") {
                alert(
                  "Sorry, this team is already full and locked. Please choose another team."
                );
                setSelectedTeam(null);
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });

        client.publish({
          destination: "/app/get-team-counts",
          body: JSON.stringify({}),
        });

        fetchTapCounts();
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        setIsConnected(false);
      },
      onWebSocketError: (error) => {
        console.error("WebSocket connection error:", error);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [username, fetchTapCounts]);

  // Team join and tap handlers
  const handleJoinTeam = useCallback(
    (teamName) => {
      if (stompClient && isConnected && username) {
        if (lockStatus[teamName]) {
          alert(
            `Sorry, ${teamName} is already full and locked. Please choose another team.`
          );
          return;
        }

        stompClient.publish({
          destination: "/app/join",
          body: JSON.stringify({
            username: username,
            teamName: teamName,
          }),
        });

        setSelectedTeam(teamName);
      } else {
        alert("WebSocket not connected. Please try again.");
      }
    },
    [stompClient, isConnected, username, lockStatus]
  );

  const handleTap = useCallback(() => {
    const currentTime = Date.now();

    // Prevent multiple rapid taps
    if (isTapping) return;

    // Limit tap to once per second
    if (currentTime - lastTapTime < 1000) {
      return;
    }

    // Set tapping state to prevent multiple taps
    setIsTapping(true);

    // Add a delay before sending the tap
    const tapDelay = setTimeout(() => {
      if (stompClient && isConnected && selectedTeam) {
        stompClient.publish({
          destination: "/app/tap",
          body: JSON.stringify({
            teamName: selectedTeam,
          }),
        });

        setLastTapTime(currentTime);
      }

      // Reset tapping state
      setIsTapping(false);
    }, 250); // 250ms delay, adjust as needed

    // Cleanup function to clear timeout if component unmounts
    return () => clearTimeout(tapDelay);
  }, [stompClient, isConnected, selectedTeam, lastTapTime, isTapping]);

  // Username submission handlers
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const trimmedUsername = usernameInput.trim();
    if (trimmedUsername) {
      setUsername(trimmedUsername);
    }
  };

  const handleUsernameChange = (e) => {
    setUsernameInput(e.target.value);
  };

  // Username Entry Screen
  if (!username) {
    return (
      <div className="app-container">
        <div className="welcome-container">
          <h1 className="app-title">Team Tapping Game</h1>
          <form onSubmit={handleUsernameSubmit} className="username-form">
            <input
              type="text"
              value={usernameInput}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="username-input"
              required
              minLength={2}
            />
            <button type="submit" className="submit-button">
              Set Username
            </button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>
        </div>
      </div>
    );
  }

  // Team Selection Screen
  if (!selectedTeam) {
    const blueCount = teamCounts["Team Blue"] || 0;
    const redCount = teamCounts["Team Red"] || 0;

    return (
      <div className="team-selection-container">
        <div className="selection-card">
          <h1 className="welcome-heading">Welcome, {username}!</h1>
          <h2 className="choose-team-heading">Choose Your Team</h2>

          <div className="team-buttons-container">
            <button
              onClick={() => handleJoinTeam("Team Blue")}
              disabled={disabledButtons["Team Blue"]}
              className={`team-button blue-team ${disabledButtons["Team Blue"] ? "disabled" : ""
                }`}
            >
              {disabledButtons["Team Blue"]
                ? `Team Blue Full (${teamMembersCount}/${teamMembersCount})`
                : `Join Team Blue (${blueCount}/${teamMembersCount})`}
            </button>

            <button
              onClick={() => handleJoinTeam("Team Red")}
              disabled={disabledButtons["Team Red"]}
              className={`team-button red-team ${disabledButtons["Team Red"] ? "disabled" : ""
                }`}
            >
              {disabledButtons["Team Red"]
                ? `Team Red Full (${teamMembersCount}/${teamMembersCount})`
                : `Join Team Red (${redCount}/${teamMembersCount})`}
            </button>
          </div>

          <div className="team-selection-info">
            <p>
              Join a team to start tapping! First team to reach 75% of total
              taps wins!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Game Room Screen
  const teamColorMain = selectedTeam === "Team Blue" ? "#044C91" : "#8D153A";
  const teamColorDark = selectedTeam === "Team Blue" ? "#023871" : "#701230";

  const gameState = calculateGameState();
  const gameOver = gameState.winner !== null;
  const winnerTeam = gameState.winner === "blue" ? "Team Blue" : "Team Red";

  // Check if both rooms are full
  const blueTeamFull = teamCounts["Team Blue"] >= teamMembersCount;
  const redTeamFull = teamCounts["Team Red"] >= teamMembersCount;
  const bothTeamsFullAndReady = blueTeamFull && redTeamFull;

  const currentMembers = teamMembers || [];
  const emptySlots = Math.max(0, teamMembersCount - currentMembers.length);
  const emptySlotElements = Array(emptySlots)
    .fill()
    .map((_, index) => (
      <li key={`empty-${index}`} className="member-item empty-slot">
        Empty Slot
      </li>
    ));

  return (
    <div className="game-room-container">
      <div className="game-card">
        <div className="team-header" style={{ backgroundColor: teamColorMain }}>
          <h1 className="team-title">{selectedTeam} Game Room</h1>
          <span className="member-count">
            {teamMembers.length}/{teamMembersCount} Players
          </span>
        </div>

        <div className="members-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>
            Team Members
          </h2>
          <ul className="members-list">
            {teamMembers.map((member) => (
              <li
                key={member.id}
                className={`member-item ${member.username === username ? "current-user" : ""
                  }`}
                style={{
                  backgroundColor:
                    member.username === username
                      ? teamColorMain
                      : `${teamColorMain}30`,
                  color: member.username === username ? "white" : teamColorDark,
                }}
              >
                {member.username}
                {member.username === username ? " (You)" : ""}
              </li>
            ))}
            {emptySlotElements}
          </ul>
        </div>

        <div className="tap-section">
          <button
            onClick={handleTap}
            className="tap-button"
            style={{
              backgroundColor: teamColorMain,
              border: `3px solid #D9B310`,
              opacity:
                gameOver || !bothTeamsFullAndReady || isTapping ? 0.6 : 1,
              cursor:
                gameOver || !bothTeamsFullAndReady || isTapping
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={gameOver || !bothTeamsFullAndReady || isTapping}
          >
            {gameOver
              ? "GAME OVER"
              : !bothTeamsFullAndReady
                ? "WAITING FOR FULL TEAMS..."
                : isTapping
                  ? "TAPPING..."
                  : "TAP!"}
          </button>
        </div>

        <div className="progress-section">
          <h2 className="progress-title">Team Battle Progress</h2>

          <div className="battle-progress-container">
            <div className="single-progress-container">
              <div className="battle-bar-container">
                <div
                  className="blue-side"
                  style={{ width: `${gameState.dividerPosition}%` }}
                ></div>
                <div
                  className="red-side"
                  style={{ width: `${100 - gameState.dividerPosition}%` }}
                ></div>
                <div
                  className="progress-divider"
                  style={{ left: `${gameState.dividerPosition}%` }}
                ></div>

                <div className="win-marker left"></div>
                <div className="win-marker right"></div>
              </div>

              <div className="progress-percentages">
                <span className="blue-percentage">
                  {(() => {
                    if (gameState.totalValidTaps === 0) return "50%";
                    return `${Math.round(
                      (gameState.blueValidTaps / gameState.totalValidTaps) * 100
                    )}%`;
                  })()}
                </span>
                <span className="red-percentage">
                  {(() => {
                    if (gameState.totalValidTaps === 0) return "50%";
                    return `${Math.round(
                      (gameState.redValidTaps / gameState.totalValidTaps) * 100
                    )}%`;
                  })()}
                </span>
              </div>
            </div>
            {gameOver && (
              <div
                className="winner-announcement"
                style={{
                  backgroundColor:
                    gameState.winner === "blue" ? "#044C91" : "#8D153A",
                  animation: "pulse-background 1.5s infinite",
                }}
              >
                <h3>{winnerTeam} Wins!</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
