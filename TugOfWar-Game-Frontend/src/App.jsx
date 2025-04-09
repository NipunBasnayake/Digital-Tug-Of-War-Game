import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import './App.css';

// Main App Component
function App() {
  const [usernameInput, setUsernameInput] = useState('');
  const [username, setUsername] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tapCount, setTapCount] = useState(0);
  const [teamTapCounts, setTeamTapCounts] = useState({
    'Team Blue': 0,
    'Team Red': 0
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const [teamCounts, setTeamCounts] = useState({
    'Team Blue': 0,
    'Team Red': 0
  });
  
  const [lockStatus, setLockStatus] = useState({
    'Team Blue': false,
    'Team Red': false
  });

  const [disabledButtons, setDisabledButtons] = useState({
    'Team Blue': false,
    'Team Red': false
  });

  const handleRoomClose = useCallback(() => {
    setSelectedTeam(null);
  }, []);

  // Fetch current tap counts
  const fetchTapCounts = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/teams/tap-counts');
      
      if (!response.ok) {
        console.error('Failed to fetch tap counts');
        return;
      }
      
      const data = await response.json();
      setTeamTapCounts(data);
    } catch (error) {
      console.error('Error fetching tap counts:', error);
    }
  }, []);

  useEffect(() => {
    // Fetch tap counts initially and set up interval
    fetchTapCounts();
    
    const tapCountsIntervalId = setInterval(() => {
      fetchTapCounts();
    }, 2000);
    
    return () => clearInterval(tapCountsIntervalId);
  }, [fetchTapCounts]);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws/websocket',
      onConnect: () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        
        client.subscribe('/topic/team-updates', (message) => {
          try {
            const teamUpdate = JSON.parse(message.body);
            console.log('Received team update:', teamUpdate);
            
            if (teamUpdate.members) {
              setTeamMembers(teamUpdate.members);
            }
            
            if (teamUpdate.tapCount !== undefined) {
              setTapCount(teamUpdate.tapCount);
              
              // Update specific team tap count
              if (teamUpdate.teamName) {
                setTeamTapCounts(prev => ({
                  ...prev,
                  [teamUpdate.teamName]: teamUpdate.tapCount
                }));
              }
            }
            
            if (teamUpdate.teamCounts) {
              console.log('Received team counts:', teamUpdate.teamCounts);
              setTeamCounts(teamUpdate.teamCounts);
            }
            
            if (teamUpdate.lockStatus) {
              console.log('Received lock status:', teamUpdate.lockStatus);
              setLockStatus(teamUpdate.lockStatus);
            }
            
            if (teamUpdate.message) {
              if (teamUpdate.message === 'Team is full') {
                alert('Sorry, this team is already full and locked. Please choose another team.');
                setSelectedTeam(null);
              } else if (teamUpdate.message.includes("now full and locked")) {
                console.log("Room is now locked");
              } else {
                console.log(teamUpdate.message);
              }
            }
            
            if (teamUpdate.roomLocked && teamUpdate.members && 
                teamUpdate.members.some(member => member.username === username)) {
                  
              if (teamUpdate.message === 'Team is full') {
                alert('This team has reached the maximum of 4 players and is locked!');
                setSelectedTeam(null);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });

        client.publish({
          destination: '/app/get-team-counts',
          body: JSON.stringify({})
        });
        
        // Get the latest tap counts
        fetchTapCounts();
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        setIsConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [username, fetchTapCounts]);

  useEffect(() => {
    if (!stompClient || !isConnected || selectedTeam) {
      return;
    }
    
    const intervalId = setInterval(() => {
      stompClient.publish({
        destination: '/app/get-team-counts',
        body: JSON.stringify({})
      });
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [stompClient, isConnected, selectedTeam]);

  // Team selection buttons disabled status
  useEffect(() => {
    const isTeamBlueLocked = lockStatus['Team Blue'] || false;
    
    if (isTeamBlueLocked && !disabledButtons['Team Blue']) {
      const timer = setTimeout(() => {
        setDisabledButtons(prev => ({
          ...prev,
          'Team Blue': true
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!isTeamBlueLocked && disabledButtons['Team Blue']) {
      setDisabledButtons(prev => ({
        ...prev,
        'Team Blue': false
      }));
    }
  }, [lockStatus, disabledButtons]);
  
  useEffect(() => {
    const isTeamRedLocked = lockStatus['Team Red'] || false;
    
    if (isTeamRedLocked && !disabledButtons['Team Red']) {
      const timer = setTimeout(() => {
        setDisabledButtons(prev => ({
          ...prev,
          'Team Red': true
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!isTeamRedLocked && disabledButtons['Team Red']) {
      setDisabledButtons(prev => ({
        ...prev,
        'Team Red': false
      }));
    }
  }, [lockStatus, disabledButtons]);

  const handleJoinTeam = useCallback((teamName) => {
    if (stompClient && isConnected && username) {
      if (lockStatus[teamName]) {
        alert(`Sorry, ${teamName} is already full and locked. Please choose another team.`);
        return;
      }

      // Publish join team message
      stompClient.publish({
        destination: '/app/join',
        body: JSON.stringify({
          username: username,
          teamName: teamName
        })
      });
      
      setSelectedTeam(teamName);
    } else {
      alert('WebSocket not connected. Please try again.');
    }
  }, [stompClient, isConnected, username, lockStatus]);

  const handleTap = useCallback(() => {
    if (stompClient && isConnected && selectedTeam) {
      stompClient.publish({
        destination: '/app/tap',
        body: JSON.stringify({
          teamName: selectedTeam
        })
      });
    }
  }, [stompClient, isConnected, selectedTeam]);

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

  // Calculate the position of the divider in the progress bar
  // Starting at 50% and moving based on the difference between teams
  const calculateProgressBarPosition = () => {
    const blueValidTaps = Math.max(0, (teamTapCounts['Team Blue'] || 0) - 20);
    const redValidTaps = Math.max(0, (teamTapCounts['Team Red'] || 0) - 20);
    
    // If no taps yet, start at 50%
    if (blueValidTaps === 0 && redValidTaps === 0) {
      return 50;
    }
    
    // Calculate the difference and adjust the midpoint (50%)
    const totalTaps = blueValidTaps + redValidTaps;
    if (totalTaps === 0) return 50;
    
    const bluePercentage = (blueValidTaps / totalTaps) * 100;
    
    // Game is won when a team reaches 75% of the total taps
    const winThreshold = 75;
    const gameIsWon = bluePercentage >= winThreshold || bluePercentage <= (100 - winThreshold);
    
    return bluePercentage;
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
            <button 
              type="submit"
              className="submit-button"
            >
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
    const blueCount = teamCounts['Team Blue'] || 0;
    const redCount = teamCounts['Team Red'] || 0;

    return (
      <div className="team-selection-container">
        <div className="selection-card">
          <h1 className="welcome-heading">Welcome, {username}!</h1>
          <h2 className="choose-team-heading">Choose Your Team</h2>
          
          <div className="team-buttons-container">
            <button 
              onClick={() => handleJoinTeam('Team Blue')}
              disabled={disabledButtons['Team Blue']}
              className={`team-button blue-team ${disabledButtons['Team Blue'] ? 'disabled' : ''}`}
            >
              {disabledButtons['Team Blue'] ? 'Team Blue Full (4/4)' : `Join Team Blue (${blueCount}/4)`}
            </button>
            
            <button 
              onClick={() => handleJoinTeam('Team Red')}
              disabled={disabledButtons['Team Red']}
              className={`team-button red-team ${disabledButtons['Team Red'] ? 'disabled' : ''}`}
            >
              {disabledButtons['Team Red'] ? 'Team Red Full (4/4)' : `Join Team Red (${redCount}/4)`}
            </button>
          </div>
          
          <div className="team-selection-info">
            <p>Join a team to start tapping! First team to reach 1000 valid taps wins the game.</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Room Screen
  const teamColorMain = selectedTeam === 'Team Blue' ? '#044C91' : '#8D153A'; // Using Sri Lankan blue and maroon
  const teamColorDark = selectedTeam === 'Team Blue' ? '#023871' : '#701230';

  // Calculate the progress bar position (percentage controlled by blue)
  const progressPosition = calculateProgressBarPosition();
  
  // Calculate valid taps for each team
  const blueValidTaps = Math.max(0, (teamTapCounts['Team Blue'] || 0) - 20);
  const redValidTaps = Math.max(0, (teamTapCounts['Team Red'] || 0) - 20);
  
  // Calculate total taps
  const totalTaps = blueValidTaps + redValidTaps;
  
  // Determine if game is won
  const blueWon = progressPosition >= 75;
  const redWon = progressPosition <= 25;
  const gameOver = blueWon || redWon;

  return (
    <div className="game-room-container">
      <div className="game-card">
        <div className="team-header" style={{ backgroundColor: teamColorMain }}>
          <h1 className="team-title">{selectedTeam} Game Room</h1>
          <span className="member-count">{teamMembers.length}/4 Players</span>
        </div>

        <div className="members-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>Team Members</h2>
          <ul className="members-list">
            {teamMembers.map((member) => (
              <li 
                key={member.id}
                className={`member-item ${member.username === username ? 'current-user' : ''}`}
                style={{ 
                  backgroundColor: member.username === username ? teamColorMain : `${teamColorMain}30`,
                  color: member.username === username ? 'white' : teamColorDark
                }}
              >
                {member.username} 
                {member.username === username ? ' (You)' : ''}
              </li>
            ))}
          </ul>
        </div>

        <div className="tap-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>Your Team Tap Count</h2>
          <div className="tap-count" style={{ color: teamColorMain }}>
            {teamTapCounts[selectedTeam] || 0}
          </div>
          
          <button 
            onClick={handleTap}
            className="tap-button"
            style={{ 
              backgroundColor: teamColorMain,
              border: `3px solid #D9B310`, // Sri Lankan gold color border
              opacity: gameOver ? 0.6 : 1,
              cursor: gameOver ? 'not-allowed' : 'pointer'
            }}
            disabled={gameOver}
          >
            {gameOver ? 'GAME OVER' : 'TAP!'}
          </button>
        </div>
        
        {/* Percentage Progress Bar */}
        <div className="progress-section">
          <h2 className="progress-title">Team Battle Progress</h2>
          
          <div className="race-progress-container">
            <div className="markers">
              <span className="marker" style={{ left: '0%' }}>0%</span>
              <span className="marker" style={{ left: '25%' }}>25%</span>
              <span className="marker" style={{ left: '50%' }}>50%</span>
              <span className="marker" style={{ left: '75%' }}>75%</span>
              <span className="marker" style={{ left: '100%' }}>100%</span>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-divider" style={{ left: `${progressPosition}%` }}></div>
              <div className="blue-side" style={{ width: `${progressPosition}%` }}></div>
              <div className="red-side" style={{ width: `${100 - progressPosition}%` }}></div>
            </div>
            
            <div className="team-indicators">
              <div className="team-indicator blue">
                <span className="indicator-color"></span>
                <span className="team-name">Team Blue</span>
                <span className="valid-count">{blueValidTaps} valid taps</span>
                <span className="percentage">{totalTaps > 0 ? Math.round(blueValidTaps / totalTaps * 100) : 50}%</span>
              </div>
              
              <div className="team-indicator red">
                <span className="indicator-color"></span>
                <span className="team-name">Team Red</span>
                <span className="valid-count">{redValidTaps} valid taps</span>
                <span className="percentage">{totalTaps > 0 ? Math.round(redValidTaps / totalTaps * 100) : 50}%</span>
              </div>
            </div>
          </div>
          
          <div className="progress-info">
            <p>First 20 taps don't count! First team to reach 75% of total taps wins!</p>
          </div>
          
          {gameOver && (
            <div className="winner-announcement" style={{ 
              backgroundColor: blueWon ? '#044C91' : '#8D153A',
              animation: 'pulse-background 1.5s infinite' 
            }}>
              <h3>{blueWon ? 'Team Blue' : 'Team Red'} Wins!</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;