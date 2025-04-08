import React, { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import TeamSelection from './components/TeamSelection';
import GameRoom from './components/GameRoom';

function App() {
  // State management
  const [username, setUsername] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [stompClient, setStompClient] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tapCount, setTapCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection setup
  useEffect(() => {
    // Create WebSocket client
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws/websocket',
      onConnect: () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        
        // Subscribe to team updates
        client.subscribe('/topic/team-updates', (message) => {
          try {
            const teamUpdate = JSON.parse(message.body);
            
            // Update team members
            if (teamUpdate.members) {
              setTeamMembers(teamUpdate.members);
            }
            
            // Update tap count
            if (teamUpdate.tapCount !== undefined) {
              setTapCount(teamUpdate.tapCount);
            }
            
            // Handle any messages or errors
            if (teamUpdate.message) {
              if (teamUpdate.message === 'Team is full') {
                setErrorMessage('Sorry, this team is already full. Please choose another team.');
                setSelectedTeam(null);
              } else {
                console.log(teamUpdate.message);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
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

    // Activate the client
    client.activate();
    setStompClient(client);

    // Cleanup on component unmount
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, []);

  // Handle team joining
  const handleJoinTeam = useCallback((teamName) => {
    if (stompClient && isConnected && username) {
      // Clear any previous error messages
      setErrorMessage('');

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
      setErrorMessage('WebSocket not connected. Please try again.');
    }
  }, [stompClient, isConnected, username]);

  // Handle tapping
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

  // Username input handler
  const handleUsernameSubmit = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername) {
      setUsername(trimmedUsername);
    }
  };

  // Render username input if no username is set
  if (!username) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center'
      }}>
        <h1>Team Tapping Game</h1>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          width: '300px' 
        }}>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ 
              padding: '10px', 
              fontSize: '16px' 
            }}
          />
          <button 
            onClick={handleUsernameSubmit}
            style={{ 
              padding: '10px', 
              fontSize: '16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none' 
            }}
          >
            Set Username
          </button>
        </div>
      </div>
    );
  }

  // Render team selection if no team is selected
  if (!selectedTeam) {
    return (
      <TeamSelection 
        username={username} 
        onJoinTeam={handleJoinTeam}
        errorMessage={errorMessage}
      />
    );
  }

  // Render game room
  return (
    <GameRoom 
      teamName={selectedTeam}
      username={username}
      members={teamMembers}
      tapCount={tapCount}
      onTap={handleTap}
    />
  );
}

export default App;