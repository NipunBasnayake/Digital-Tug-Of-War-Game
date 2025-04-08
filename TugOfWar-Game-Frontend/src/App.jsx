import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import './App.css';

// TeamSelection Component (inline)
const TeamSelection = ({ username, onJoinTeam, teamCounts = {}, lockStatus = {} }) => {

  const [disabledButtons, setDisabledButtons] = useState({
    'Team Blue': false,
    'Team Red': false
  });

  const blueCount = teamCounts['Team Blue'] || 0;
  const redCount = teamCounts['Team Red'] || 0;

  const isTeamBlueLocked = lockStatus['Team Blue'] || false;
  const isTeamRedLocked = lockStatus['Team Red'] || false;
  
  useEffect(() => {
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
  }, [isTeamBlueLocked, disabledButtons]);
  
  useEffect(() => {
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
  }, [isTeamRedLocked, disabledButtons]);

  return (
    <div className="team-selection-container">
      <div className="selection-card">
        <h1 className="welcome-heading">Welcome, {username}!</h1>
        <h2 className="choose-team-heading">Choose Your Team</h2>
        
        <div className="team-buttons-container">
          <button 
            onClick={() => onJoinTeam('Team Blue')}
            disabled={disabledButtons['Team Blue']}
            className={`team-button blue-team ${disabledButtons['Team Blue'] ? 'disabled' : ''}`}
          >
            {disabledButtons['Team Blue'] ? 'Team Blue Full (4/4)' : `Join Team Blue (${blueCount}/4)`}
          </button>
          
          <button 
            onClick={() => onJoinTeam('Team Red')}
            disabled={disabledButtons['Team Red']}
            className={`team-button red-team ${disabledButtons['Team Red'] ? 'disabled' : ''}`}
          >
            {disabledButtons['Team Red'] ? 'Team Red Full (4/4)' : `Join Team Red (${redCount}/4)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const GameRoom = ({ teamName, username, members = [], tapCount, onTap, onClose }) => {
  const teamColorMain = teamName === 'Team Blue' ? '#3498db' : '#e74c3c';
  const teamColorDark = teamName === 'Team Blue' ? '#2980b9' : '#c0392b';

  useEffect(() => {
    if (members.length > 4) {
      alert(`This ${teamName} room has been closed because it has more than 4 players.`);
      onClose();
    }
  }, [members.length, teamName, onClose]);

  return (
    <div className="game-room-container">
      <div className="game-card">
        <div className="team-header" style={{ backgroundColor: teamColorMain }}>
          <h1 className="team-title">{teamName} Game Room</h1>
          <span className="member-count">{members.length}/4 Players</span>
        </div>

        <div className="members-section">
          <h2 className="section-title" style={{ color: teamColorMain }}>Team Members</h2>
          <ul className="members-list">
            {members.map((member) => (
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
          <h2 className="section-title" style={{ color: teamColorMain }}>Team Tap Count</h2>
          <div className="tap-count" style={{ color: teamColorMain }}>{tapCount}</div>
          
          <button 
            onClick={onTap}
            className="tap-button"
            style={{ backgroundColor: teamColorMain }}
          >
            TAP!
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [usernameInput, setUsernameInput] = useState('');
  const [username, setUsername] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tapCount, setTapCount] = useState(0);
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

  const handleRoomClose = useCallback(() => {
    setSelectedTeam(null);
  }, []);

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
  }, [username]);

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

  if (!selectedTeam) {
    return (
      <TeamSelection 
        username={username} 
        onJoinTeam={handleJoinTeam}
        teamCounts={teamCounts}
        lockStatus={lockStatus}
      />
    );
  }

  return (
    <GameRoom 
      teamName={selectedTeam}
      username={username}
      members={teamMembers}
      tapCount={tapCount}
      onTap={handleTap}
      onClose={handleRoomClose}
    />
  );
}

export default App;