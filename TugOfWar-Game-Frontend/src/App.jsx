import React, { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {
  const WS_URL = "fly-allowing-oddly.ngrok-free.app";
  const [teamMembersCount, setTeamMembersCount] = useState(1);

  const [buttonEnableTime, setButtonEnableTime] = useState(3000);
  const [buttonDisableTime, setButtonDisableTime] = useState(5000);

  const buttonTimerRef = useRef(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const countdownTimerRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);

  const [gameTimeLeft, setGameTimeLeft] = useState(2 * 60);
  const [gameTimerActive, setGameTimerActive] = useState(false);
  const gameTimerRef = useRef(null);

  const [isGameCreated, setIsGameCreated] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [blueTeamMembers, setBlueTeamMembers] = useState([]);
  const [redTeamMembers, setRedTeamMembers] = useState([]);
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

  const [lastTapTime, setLastTapTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTapping, setIsTapping] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(true);

  useEffect(() => {
    return () => {
      if (buttonTimerRef.current) {
        clearTimeout(buttonTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  const updateButtonTimings = useCallback((enableTimeMs, disableTimeMs) => {
    if (buttonTimerRef.current) {
      clearTimeout(buttonTimerRef.current);
    }

    setButtonEnableTime(enableTimeMs);
    setButtonDisableTime(disableTimeMs);

    startAsymmetricButtonLoop(enableTimeMs, disableTimeMs);
  }, []);

  const startAsymmetricButtonLoop = useCallback((enableTime, disableTime) => {
    setIsButtonEnabled(true);

    const runToggleCycle = () => {
      if (buttonTimerRef.current) {
        clearTimeout(buttonTimerRef.current);
      }

      buttonTimerRef.current = setTimeout(() => {
        setIsButtonEnabled(false);

        buttonTimerRef.current = setTimeout(() => {
          setIsButtonEnabled(true);
          runToggleCycle();
        }, disableTime);
      }, enableTime);
    };

    runToggleCycle();

    return () => {
      if (buttonTimerRef.current) {
        clearTimeout(buttonTimerRef.current);
      }
    };
  }, []);

  const startGameTimer = useCallback(() => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }

    setGameTimeLeft(gameTimeLeft);
    setGameTimerActive(true);

    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(gameTimerRef.current);
          setGameTimerActive(false);
          setGameEnded(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  const startCountdownTimer = useCallback(() => {
    if (gameStarted) return;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setShowCountdown(true);
    setCountdownValue(10);

    const timer = setInterval(() => {
      setCountdownValue(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timer);
          setShowCountdown(false);
          setGameStarted(true);

          startAsymmetricButtonLoop(buttonEnableTime, buttonDisableTime);
          startGameTimer();

          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    countdownTimerRef.current = timer;

    return () => {
      clearInterval(timer);
    };
  }, [buttonEnableTime, buttonDisableTime, gameStarted, startAsymmetricButtonLoop, startGameTimer]);

  const calculateGameState = useCallback(() => {
    const minimumRequiredTaps = 100;
    const initialTeamTaps = 0;
    const blueTaps = teamTapCounts["Team Blue"] || 0;
    const redTaps = teamTapCounts["Team Red"] || 0;

    const blueTeamCount = teamCounts["Team Blue"] || 0;
    const redTeamCount = teamCounts["Team Red"] || 0;
    const bothTeamsFull =
      blueTeamCount >= teamMembersCount && redTeamCount >= teamMembersCount;

    const blueValidTaps = bothTeamsFull
      ? Math.max(0, blueTaps - initialTeamTaps)
      : 0;
    const redValidTaps = bothTeamsFull
      ? Math.max(0, redTaps - initialTeamTaps)
      : 0;

    const blueScaledTaps = bothTeamsFull ? Math.floor(blueValidTaps / 5) : 0;
    const redScaledTaps = bothTeamsFull ? Math.floor(redValidTaps / 5) : 0;

    const totalValidTaps = blueScaledTaps + redScaledTaps;

    let dividerPosition = 50;
    if (totalValidTaps > 0) {
      dividerPosition = (blueScaledTaps / totalValidTaps) * 100;
    }

    let winner = null;
    let winMessage = "";

    if (gameEnded) {
      if (dividerPosition > 50) {
        winner = "blue";
        winMessage = "Team Blue Wins!";
      } else if (dividerPosition < 50) {
        winner = "red";
        winMessage = "Team Red Wins!";
      } else {
        winner = "tie";
        winMessage = "It's a Tie!";
      }
    } else if (totalValidTaps >= minimumRequiredTaps) {
      if (dividerPosition >= 75) {
        winner = "blue";
        winMessage = "Team Blue Wins!";
      } else if (dividerPosition <= 25) {
        winner = "red";
        winMessage = "Team Red Wins!";
      }
    }

    return {
      blueValidTaps: blueScaledTaps,
      redValidTaps: redScaledTaps,
      totalValidTaps,
      dividerPosition,
      winner,
      canWin: totalValidTaps >= minimumRequiredTaps,
      winMessage
    };
  }, [teamTapCounts, teamCounts, teamMembersCount, gameEnded]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      const protocol = window.location.protocol;
      const baseUrl = `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"}`;

      const tapResponse = await fetch(
        `${baseUrl}/api/teams/tap-counts`
      );

      if (tapResponse.ok) {
        const tapData = await tapResponse.json();
        setTeamTapCounts(tapData);
      }

      const membersResponse = await fetch(
        `${baseUrl}/api/teams/all-data`
      );

      if (membersResponse.ok) {
        const data = await membersResponse.json();

        if (data.memberCounts) {
          setTeamCounts(data.memberCounts);
        }

        if (data.lockStatus) {
          setLockStatus(data.lockStatus);
        }

        if (data.teams) {
          if (data.teams["Team Blue"] && data.teams["Team Blue"].members) {
            const blueMembers = data.teams["Team Blue"].members.filter(
              (member) => member !== null
            );
            setBlueTeamMembers(blueMembers);
            if (selectedTeam === "Team Blue") {
              setTeamMembers(blueMembers);
            }
          }

          if (data.teams["Team Red"] && data.teams["Team Red"].members) {
            const redMembers = data.teams["Team Red"].members.filter(
              (member) => member !== null
            );
            setRedTeamMembers(redMembers);
            if (selectedTeam === "Team Red") {
              setTeamMembers(redMembers);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching team details:", error);
    }
  }, [WS_URL, selectedTeam]);

  useEffect(() => {
    const updatedDisabledButtons = {
      "Team Blue":
        lockStatus["Team Blue"] ||
        (teamCounts["Team Blue"] || 0) >= teamMembersCount,
      "Team Red":
        lockStatus["Team Red"] ||
        (teamCounts["Team Red"] || 0) >= teamMembersCount,
    };
    setDisabledButtons(updatedDisabledButtons);
  }, [teamCounts, lockStatus, teamMembersCount]);

  useEffect(() => {
    const blueTeamFull = teamCounts["Team Blue"] >= teamMembersCount;
    const redTeamFull = teamCounts["Team Red"] >= teamMembersCount;
    const bothTeamsFullAndReady = blueTeamFull && redTeamFull;

    if (bothTeamsFullAndReady && !gameStarted && !showCountdown) {
      startCountdownTimer();
    }
  }, [teamCounts, teamMembersCount, gameStarted, showCountdown, startCountdownTimer]);

  useEffect(() => {
    const protocol = window.location.protocol;
    const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${protocol === "https:" ? WS_URL : "localhost:8080"}/ws/websocket`;

    if (stompClient) {
      stompClient.deactivate();
    }

    const client = new Client({
      brokerURL: wsUrl,
      onConnect: () => {
        setIsConnected(true);

        client.subscribe("/topic/team-updates", (message) => {
          try {
            const teamUpdate = JSON.parse(message.body);

            if (teamUpdate.members) {
              const updatedMembers = teamUpdate.members.filter(
                (member) => member !== null
              ).map(member => ({
                username: member.username,
                id: member.id
              }));

              if (teamUpdate.teamName === "Team Blue") {
                setBlueTeamMembers(updatedMembers);
                if (selectedTeam === "Team Blue") {
                  setTeamMembers(updatedMembers);
                }
              } else if (teamUpdate.teamName === "Team Red") {
                setRedTeamMembers(updatedMembers);
                if (selectedTeam === "Team Red") {
                  setTeamMembers(updatedMembers);
                }
              }
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

              if (
                teamUpdate.message.includes("left the team") ||
                teamUpdate.message.includes("joined")
              ) {
                fetchTeamDetails();
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

        fetchTeamDetails();
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
  }, [WS_URL, fetchTeamDetails, selectedTeam]);

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

  const handleLeaveTeam = useCallback(() => {
    if (stompClient && isConnected && selectedTeam) {
      stompClient.publish({
        destination: "/app/leave",
        body: JSON.stringify({
          username: username,
          teamName: selectedTeam,
        }),
      });

      setUsername("");
      setSelectedTeam(null);
    }
  }, [stompClient, isConnected, selectedTeam, username]);

  const handleTap = useCallback(() => {
    if (isTapping || !isButtonEnabled || !gameStarted || gameEnded) return;

    const currentTime = Date.now();

    if (currentTime - lastTapTime < 10) {
      return;
    }

    setIsTapping(true);

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

      setIsTapping(false);
    }, 250);

    return () => clearTimeout(tapDelay);
  }, [stompClient, isConnected, selectedTeam, lastTapTime, isTapping, isButtonEnabled, gameStarted, gameEnded]);

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

  const changeButtonTiming = (newEnableTimeMs, newDisableTimeMs) => {
    updateButtonTimings(newEnableTimeMs, newDisableTimeMs);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!username) {
    return (
      <div className="app-container">
        <div className="welcome-container">
          <h1 className="app-title">Digital Tug of War Game</h1>
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
              className={`team-button blue-team ${disabledButtons["Team Blue"] ? "disabled" : ""}`}
            >
              {disabledButtons["Team Blue"]
                ? `Team Blue Full (${teamMembersCount}/${teamMembersCount})`
                : `Join Team Blue (${blueCount}/${teamMembersCount})`}
            </button>

            <button
              onClick={() => handleJoinTeam("Team Red")}
              disabled={disabledButtons["Team Red"]}
              className={`team-button red-team ${disabledButtons["Team Red"] ? "disabled" : ""}`}
            >
              {disabledButtons["Team Red"]
                ? `Team Red Full (${teamMembersCount}/${teamMembersCount})`
                : `Join Team Red (${redCount}/${teamMembersCount})`}
            </button>
          </div>

          <div className="team-selection-info">
            <p>
              Join a team to play the game! Each team has 4 members and 10 minutes to play. When time runs out, the team that reaches more than 50% progress wins!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const teamColorMain = selectedTeam === "Team Blue" ? "#044C91" : "#8D153A";
  const teamColorDark = selectedTeam === "Team Blue" ? "#023871" : "#701230";

  const gameState = calculateGameState();
  const gameOver = gameState.winner !== null;
  const winnerMessage = gameState.winMessage || (gameState.winner === "blue" ? "Team Blue Wins!" : gameState.winner === "red" ? "Team Red Wins!" : "It's a Tie!");

  const blueTeamFull = teamCounts["Team Blue"] >= teamMembersCount;
  const redTeamFull = teamCounts["Team Red"] >= teamMembersCount;
  const bothTeamsFullAndReady = blueTeamFull && redTeamFull;

  const teamMembersDisplay = Array(teamMembersCount).fill(null);

  teamMembers.forEach((member, index) => {
    if (index < teamMembersCount) {
      teamMembersDisplay[index] = member;
    }
  });

  return (
    <div className="game-room-container">
      {showCountdown && (
        <div className="countdown-overlay">
          <div className="countdown-popup">
            <h2>Game Starting In</h2>
            <div className="countdown-number">{countdownValue}</div>
            <p>Get ready to tap!</p>
          </div>
        </div>
      )}

      <div className="game-card">
        <div className="team-header" style={{ backgroundColor: teamColorMain }}>
          <h1 className="team-title">{selectedTeam}</h1>
          <span className="member-count">
            {teamMembers.length}/{teamMembersCount} Players
          </span>
        </div>

        {gameStarted && !gameOver && (
          <div className="timer-section">
            <h3 className="timer-label">Time Remaining: </h3>
            <div className="timer-display">{formatTime(gameTimeLeft)}</div>
          </div>
        )}

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
                <div className="center-marker" style={{ left: '50%' }}></div>
              </div>

              <div className="progress-percentages">
                <span className="blue-percentage">
                  {(() => {
                    if (gameState.totalValidTaps === 0) return "50%";
                    return `${Math.round(
                      (gameState.blueValidTaps ** 1.2) * 100 / ((gameState.blueValidTaps ** 1.2) + (gameState.redValidTaps ** 1.2))
                    )}%`;
                  })()}
                </span>
                <span className="red-percentage">
                  {(() => {
                    if (gameState.totalValidTaps === 0) return "50%";
                    return `${Math.round(
                      (gameState.redValidTaps ** 1.2) * 100 / ((gameState.blueValidTaps ** 1.2) + (gameState.redValidTaps ** 1.2))
                    )}%`;
                  })()}
                </span>
              </div>
            </div>


            {/* {gameOver && (
              <div
                className="winner-announcement"
                style={{
                  backgroundColor:
                    gameState.winner === "blue" ? "#044C91" :
                      gameState.winner === "red" ? "#8D153A" : "#555",
                  animation: "pulse-background 1.5s infinite",
                }}
              >
                <h3>{winnerMessage}</h3>
              </div>
            )} */}
            

            {gameOver && (
              <div className="winner-popup-overlay">
                <div className="winner-popup">
                  <div
                    className="winner-popup-header"
                    style={{
                      backgroundColor:
                        gameState.winner === "blue" ? "#044C91" :
                          gameState.winner === "red" ? "#8D153A" : "#555"
                    }}
                  >
                    <h3 className="winner-message">{winnerMessage}</h3>
                  </div>

                  <div className="winner-popup-content">
                    <div className="trophy-icon">🏆</div>
                    <p>Congratulations to {gameState.winner === "blue" ? "Team Blue" : gameState.winner === "red" ? "Team Red" : "both teams"}!</p>

                    <button
                      onClick={() => window.location.reload()}
                      className="refresh-button"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="tap-section">
          <button
            onClick={handleTap}
            className="tap-button"
            style={{
              backgroundColor: teamColorMain,
              border: `3px solid #D9B310`,
              opacity:
                gameOver || !bothTeamsFullAndReady || !isButtonEnabled || !gameStarted ? 0.6 : 1,
              cursor:
                gameOver || !bothTeamsFullAndReady || !isButtonEnabled || !gameStarted
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={gameOver || !bothTeamsFullAndReady || !isButtonEnabled || !gameStarted}
          >
            {gameOver
              ? "GAME OVER"
              : !bothTeamsFullAndReady
                ? "WAITING FOR FULL TEAMS..."
                : !gameStarted
                  ? "WAITING FOR GAME TO START..."
                  : !isButtonEnabled
                    ? "COOLDOWN..."
                    : "TAP NOW!"}
          </button>
        </div>

        <div className="members-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>
            Team Members
          </h2>
          <ul className="members-list">
            {teamMembersDisplay.map((member, index) => {
              return member ? (
                <li
                  key={member.id || `member-${index}`}
                  className={`member-item ${member.username === username ? "current-user" : ""}`}
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
              ) : (
                <li key={`empty-${index}`} className="member-item empty-slot">
                  Empty Slot
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="leave-section"
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <button
            onClick={handleLeaveTeam}
            className="leave-button"
            style={{
              backgroundColor: teamColorMain,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
              width: "100%",
              maxWidth: "200px",
            }}
          >
            Leave Team
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;