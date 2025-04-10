import React, { useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import "./App.css";

function App() {
  
  const WS_URL = "fly-allowing-oddly.ngrok-free.app";
  
  const [teamMembersCount, setTeamMembersCount] = useState(2);
  const [isGameCreated, setIsGameCreated] = useState(true);

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

  // Updated calculateGameState function
  const calculateGameState = useCallback(() => {
    const minimumRequiredTaps = 100;
    const initialTeamTaps = 0;
    const blueTaps = teamTapCounts["Team Blue"] || 0;
    const redTaps = teamTapCounts["Team Red"] || 0;

    const blueTeamCount = teamCounts["Team Blue"] || 0;
    const redTeamCount = teamCounts["Team Red"] || 0;
    const bothTeamsFull =
      blueTeamCount >= teamMembersCount && redTeamCount >= teamMembersCount;

    // Calculate valid taps considering initial taps and team fullness
    const blueValidTaps = bothTeamsFull 
      ? Math.max(0, blueTaps - initialTeamTaps) 
      : 0;
    const redValidTaps = bothTeamsFull 
      ? Math.max(0, redTaps - initialTeamTaps) 
      : 0;

    // Divide team taps by 5 when total reaches 100
    const blueScaledTaps = bothTeamsFull 
      ? Math.floor(blueValidTaps / 5) 
      : 0;
    const redScaledTaps = bothTeamsFull 
      ? Math.floor(redValidTaps / 5) 
      : 0;

    const totalValidTaps = blueScaledTaps + redScaledTaps;

    // Calculate divider position with smooth movement
    let dividerPosition = 50;
    if (totalValidTaps > 0) {
      dividerPosition = (blueScaledTaps / totalValidTaps) * 100;
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
      blueValidTaps: blueScaledTaps,
      redValidTaps: redScaledTaps,
      totalValidTaps,
      dividerPosition,
      winner,
      canWin,
    };
  }, [teamTapCounts, teamCounts, teamMembersCount]);

  const fetchTeamDetails = useCallback(async () => {
    try {
      const protocol = window.location.protocol;
      // Fetch tap counts
      const tapResponse = await fetch(
        `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/api/teams/tap-counts`
      );
      
      if (tapResponse.ok) {
        const tapData = await tapResponse.json();
        setTeamTapCounts(tapData);
      }
      
      // Fetch team members and counts
      const membersResponse = await fetch(
        `${protocol}//${protocol === "https:" ? WS_URL : "localhost:8080"
        }/api/teams/all-data`
      );
      
      if (membersResponse.ok) {
        const data = await membersResponse.json();
        
        // Update team counts
        if (data.memberCounts) {
          setTeamCounts(data.memberCounts);
        }
        
        // Update lock status
        if (data.lockStatus) {
          setLockStatus(data.lockStatus);
        }
        
        // Update team members
        if (data.teams) {
          if (data.teams["Team Blue"] && data.teams["Team Blue"].members) {
            const blueMembers = data.teams["Team Blue"].members.filter(member => member !== null);
            setBlueTeamMembers(blueMembers);
            if (selectedTeam === "Team Blue") {
              setTeamMembers(blueMembers);
            }
          }
          
          if (data.teams["Team Red"] && data.teams["Team Red"].members) {
            const redMembers = data.teams["Team Red"].members.filter(member => member !== null);
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
              // Update the team members list
              const updatedMembers = teamUpdate.members.filter(member => member !== null);
              
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
              
              if (teamUpdate.message.includes("left the team") || 
                  teamUpdate.message.includes("joined")) {
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
  }, [username, fetchTeamDetails, teamMembersCount, selectedTeam]);

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

  if (!username) {
    return (
      <div className="app-container">
        <div className="welcome-container">
          <h1 className="app-title">Online Tapping Game</h1>
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

  const teamColorMain = selectedTeam === "Team Blue" ? "#044C91" : "#8D153A";
  const teamColorDark = selectedTeam === "Team Blue" ? "#023871" : "#701230";

  const gameState = calculateGameState();
  const gameOver = gameState.winner !== null;
  const winnerTeam = gameState.winner === "blue" ? "Team Blue" : "Team Red";

  const blueTeamFull = teamCounts["Team Blue"] >= teamMembersCount;
  const redTeamFull = teamCounts["Team Red"] >= teamMembersCount;
  const bothTeamsFullAndReady = blueTeamFull && redTeamFull;

  // Create a fixed size array to display team members including empty slots
  const teamMembersDisplay = Array(teamMembersCount).fill(null);
  
  // Fill in the array with actual team members
  teamMembers.forEach((member, index) => {
    if (index < teamMembersCount) {
      teamMembersDisplay[index] = member;
    }
  });

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