import React, { useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {
  const WS_URL = "f2b9-157-157-116-180.ngrok-free.app";
  
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [isGameCreated, setIsGameCreated] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store team members separately for each team
  const [blueTeamMembers, setBlueTeamMembers] = useState([]);
  const [redTeamMembers, setRedTeamMembers] = useState([]);
  
  // Current team's members (based on selected team)
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
    "Team Blue": true,
    "Team Red": true,
  });

  const [lastTapTime, setLastTapTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTapping, setIsTapping] = useState(false);

  // Set current team members when selected team changes
  useEffect(() => {
    if (selectedTeam === "Team Blue") {
      setTeamMembers(blueTeamMembers);
    } else if (selectedTeam === "Team Red") {
      setTeamMembers(redTeamMembers);
    }
  }, [selectedTeam, blueTeamMembers, redTeamMembers]);

  const calculateGameState = useCallback(() => {
    const minimumRequiredTaps = 50;
    const blueTaps = teamTapCounts["Team Blue"] || 0;
    const redTaps = teamTapCounts["Team Red"] || 0;

    const blueTeamCount = teamCounts["Team Blue"] || 0;
    const redTeamCount = teamCounts["Team Red"] || 0;
    const bothTeamsFull =
      blueTeamCount >= teamMembersCount && redTeamCount >= teamMembersCount;

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
  }, [teamTapCounts, teamCounts, teamMembersCount]);

  // Fetch team members from the server
  const fetchTeamMembers = useCallback(async () => {
    try {
      const protocol = window.location.protocol;
      const response = await fetch(
        `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/api/admin/players`
      );

      if (!response.ok) {
        console.error("Failed to fetch team members");
        return;
      }
      
      const data = await response.json();
      
      // Initialize fixed-size arrays for both teams
      const blueMembers = Array(teamMembersCount).fill(null);
      const redMembers = Array(teamMembersCount).fill(null);
      
      // Fill in blue team members
      if (data["Team Blue"]) {
        data["Team Blue"].forEach((member, index) => {
          if (index < teamMembersCount && member) {
            blueMembers[index] = member;
          }
        });
      }
      
      // Fill in red team members
      if (data["Team Red"]) {
        data["Team Red"].forEach((member, index) => {
          if (index < teamMembersCount && member) {
            redMembers[index] = member;
          }
        });
      }
      
      // Update team members state
      setBlueTeamMembers(blueMembers);
      setRedTeamMembers(redMembers);
      
      // Update current team's members if applicable
      if (selectedTeam === "Team Blue") {
        setTeamMembers(blueMembers);
      } else if (selectedTeam === "Team Red") {
        setTeamMembers(redMembers);
      }
      
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  }, [WS_URL, teamMembersCount, selectedTeam]);

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
  }, [WS_URL]);

  const fetchGameState = useCallback(async () => {
    try {
      const protocol = window.location.protocol;
      const response = await fetch(
        `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/api/admin/game-state`
      );

      if (!response.ok) {
        setIsGameCreated(false);
        setTeamMembersCount(0);
        return;
      }
      
      const data = await response.json();
      
      if (data.maxTeamSize) {
        setTeamMembersCount(data.maxTeamSize);
      } else {
        setTeamMembersCount(0);
      }
      
      setIsGameCreated(data.isGameCreated || false);
      
      // After getting game state, fetch team members
      fetchTeamMembers();
      
    } catch (error) {
      console.error("Error fetching game state:", error);
      setIsGameCreated(false);
      setTeamMembersCount(0);
    }
  }, [WS_URL, fetchTeamMembers]);

  useEffect(() => {
    const updatedDisabledButtons = {
      "Team Blue": 
        !isGameCreated || 
        lockStatus["Team Blue"] || 
        (teamCounts["Team Blue"] || 0) >= teamMembersCount,
      "Team Red": 
        !isGameCreated || 
        lockStatus["Team Red"] || 
        (teamCounts["Team Red"] || 0) >= teamMembersCount,
    };
    setDisabledButtons(updatedDisabledButtons);
    
    if (!isGameCreated && selectedTeam) {
      setSelectedTeam(null);
      alert("The game has been reset or is not available. Please wait for an admin to create a new game.");
    }
  }, [teamCounts, lockStatus, teamMembersCount, isGameCreated, selectedTeam]);

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

            // Handle team members update based on team name
            if (teamUpdate.members) {
              // Create an array of fixed size
              const fixedMembers = Array(teamMembersCount).fill(null);
              
              // Fill in only the non-null members from the update
              teamUpdate.members.forEach((member, index) => {
                if (member !== null) {
                  fixedMembers[index] = member;
                }
              });
              
              // Update the appropriate team's members
              if (teamUpdate.teamName === "Team Blue") {
                setBlueTeamMembers(fixedMembers);
                if (selectedTeam === "Team Blue") {
                  setTeamMembers(fixedMembers);
                }
              } else if (teamUpdate.teamName === "Team Red") {
                setRedTeamMembers(fixedMembers);
                if (selectedTeam === "Team Red") {
                  setTeamMembers(fixedMembers);
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
              
              if (teamUpdate.message.includes("Max team size updated to")) {
                const newSize = parseInt(teamUpdate.message.split("to ")[1]);
                if (!isNaN(newSize)) {
                  setTeamMembersCount(newSize);
                  setIsGameCreated(true);
                  fetchTeamMembers(); // Refetch team members after size change
                  console.log(`Maximum team size updated to ${newSize}`);
                }
              }
              
              if (teamUpdate.message.includes("Game has been reset")) {
                setIsGameCreated(false);
                setBlueTeamMembers(Array(teamMembersCount).fill(null));
                setRedTeamMembers(Array(teamMembersCount).fill(null));
                if (selectedTeam) {
                  setSelectedTeam(null);
                  alert("The game has been reset by an admin. Please wait for a new game to be created.");
                }
              }
              
              if (teamUpdate.message.includes("Game created with team size")) {
                const newSize = parseInt(teamUpdate.message.split("size ")[1]);
                if (!isNaN(newSize)) {
                  setTeamMembersCount(newSize);
                  setIsGameCreated(true);
                  setBlueTeamMembers(Array(newSize).fill(null));
                  setRedTeamMembers(Array(newSize).fill(null));
                  console.log(`Game created with team size ${newSize}`);
                }
              }
              
              if (teamUpdate.message.includes("left the team") || 
                  teamUpdate.message.includes("joined")) {
                // Refetch team members to ensure we have accurate data
                fetchTeamMembers();
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
        fetchGameState();
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
  }, [username, fetchTapCounts, fetchGameState, teamMembersCount, fetchTeamMembers, selectedTeam]);

  const handleJoinTeam = useCallback(
    (teamName) => {
      if (!isGameCreated) {
        alert("No active game exists. Please wait for an admin to create a game.");
        return;
      }
      
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
    [stompClient, isConnected, username, lockStatus, isGameCreated]
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
    const currentTime = Date.now();

    if (isTapping) return;

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
  }, [stompClient, isConnected, selectedTeam, lastTapTime, isTapping]);

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
          
          {!isGameCreated && (
            <div className="waiting-for-game">
              <h2 className="waiting-heading">Waiting for Game</h2>
              <p className="waiting-message">
                No active game exists. Please wait for an admin to create a game.
              </p>
            </div>
          )}
          
          {isGameCreated && (
            <>
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
            </>
          )}
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

  const blueTeamFull = teamCounts["Team Blue"] >= teamMembersCount;
  const redTeamFull = teamCounts["Team Red"] >= teamMembersCount;
  const bothTeamsFullAndReady = blueTeamFull && redTeamFull;

  return (
    <div className="game-room-container">
      <div className="game-card">
        <div className="team-header" style={{ backgroundColor: teamColorMain }}>
          <h1 className="team-title">{selectedTeam} Game Room</h1>
          <span className="member-count">
            {teamMembers.filter(Boolean).length}/{teamMembersCount} Players
          </span>
        </div>

        <div className="members-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>
            Team Members
          </h2>
          <ul className="members-list">
            {Array(teamMembersCount).fill().map((_, index) => {
              const member = teamMembers[index] || null;
              
              return member ? (
                <li
                  key={member.id}
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
        
        <div className="leave-section" style={{ marginTop: "20px", textAlign: "center" }}>
          <button 
            onClick={handleLeaveTeam}
            className="leave-button"
            style={{
              backgroundColor: teamColorMain,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%',
              maxWidth: '200px'
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