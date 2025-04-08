import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE_URL = (typeof window !== 'undefined' && window.ENV && window.ENV.API_URL) 
  ? window.ENV.API_URL 
  : 'http://localhost:8080';

function App() {
  const [count, setCount] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [userId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
  const [userName, setUserName] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [teamName, setTeamName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [buttonScale, setButtonScale] = useState(1);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms`);
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRoomCount = useCallback(async (roomName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/button/count/${roomName}`);
      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
        setUserStats(data.userStats || []);
      }
    } catch (error) {
      console.error('Error fetching room count:', error);
    }
  }, []);

  const submitUserName = () => {
    if (userNameInput.trim()) {
      setUserName(userNameInput.trim());
    }
  };

  const createRoom = async () => {
    if (!teamName.trim()) return alert('Please enter a team name');
    if (!userName) return alert('Please set your name before creating a room');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId,
          userName,
          teamName: teamName.trim(),
          password: roomPassword.trim() || null
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTeamName('');
        setRoomPassword('');
        await joinRoom(result.room.name, result.room.passwordProtected ? roomPassword : null);
        setCurrentView('game');
      } else {
        alert(result.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room: ' + error.message);
    }
  };

  const attemptJoinRoom = (roomName, isPasswordProtected) => {
    if (!userName) return alert('Please set your name before joining a room');
    
    if (isPasswordProtected) {
      const roomToJoin = rooms.find(room => room.name === roomName);
      if (roomToJoin) {
        setJoinRoomId(roomName);
        setShowJoinModal(true);
      }
    } else {
      joinRoom(roomName);
    }
  };

  const joinRoom = async (roomName, password = null) => {
    if (currentRoom === roomName) return;
    
    if (currentRoom) {
      const currentRoomObj = rooms.find(r => r.name === currentRoom);
      if (currentRoomObj && currentRoomObj.leaderUserId === userId) {
        return alert("You are the leader of your current room. You must delete your room before joining another.");
      }
      await leaveRoom(currentRoom);
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/join`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          userId, 
          userName,
          roomName,
          password 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentRoom(roomName);
        if (showJoinModal) {
          setShowJoinModal(false);
          setJoinPassword('');
          setJoinRoomId(null);
        }
        await fetchRoomCount(roomName);
        setCurrentView('game');
      } else {
        alert(result.message || "Could not join room");
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const submitJoinPassword = () => {
    if (!joinPassword.trim()) return alert('Please enter the password');
    joinRoom(joinRoomId, joinPassword.trim());
  };

  const leaveRoom = async (roomName) => {
    const room = rooms.find(r => r.name === roomName);
    if (room && room.leaderUserId === userId) {
      return alert("You are the leader of this room. You must delete the room instead of leaving.");
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/leave`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, roomName }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentRoom(null);
        setCount(0);
        setUserStats([]);
        setCurrentView('home');
      } else {
        alert(result.message || "Could not leave room");
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };
  
  const deleteRoom = async () => {
    if (!currentRoom) return;
    
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/delete`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, roomName: currentRoom }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          setCurrentRoom(null);
          setCount(0);
          setUserStats([]);
          setCurrentView('home');
        } else {
          alert(result.message || "Could not delete room");
        }
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleButtonTap = async () => {
    if (!currentRoom) return alert("Please join a room first");
    
    setButtonScale(0.95);
    setTimeout(() => setButtonScale(1), 100);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/button/tap`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId, userName, roomName: currentRoom }),
      });
      
      const result = await response.json();
      setCount(result.count);
      setUserStats(result.userStats || []);
    } catch (error) {
      console.error('Error sending button tap:', error);
    }
  };
  
  const isRoomLeader = () => {
    if (!currentRoom) return false;
    const room = rooms.find(r => r.name === currentRoom);
    return room && room.leaderUserId === userId;
  };
  
  const toggleDropdown = () => setShowDropdown(!showDropdown);
  
  const getCurrentRoomInfo = () => {
    if (!currentRoom) return null;
    return rooms.find(r => r.name === currentRoom);
  };

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const RoomDropdown = () => (
    <div className={`room-dropdown ${showDropdown ? 'show' : ''}`}>
      <div className="dropdown-header">
        <h3>Available Rooms</h3>
        <button className="close-dropdown" onClick={toggleDropdown}>×</button>
      </div>
      <div className="dropdown-content">
        {rooms.length === 0 ? (
          <div className="no-rooms">No rooms available</div>
        ) : (
          <ul className="room-list">
            {rooms.map(room => (
              <li 
                key={room.id} 
                className={`room-item ${currentRoom === room.name ? 'active' : ''} ${room.isFull ? 'full' : ''}`}
                onClick={() => {
                  if (!room.isFull || room.userIds.includes(userId)) {
                    attemptJoinRoom(room.name, room.passwordProtected);
                    toggleDropdown();
                  }
                }}
              >
                <div className="room-item-name">{room.teamName}</div>
                <div className="room-item-info">
                  <span className="room-item-users">{room.userCount}/4</span>
                  {room.passwordProtected && <span className="room-item-lock">🔒</span>}
                  {room.isFull && <span className="room-item-full">FULL</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  
  const JoinPasswordModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Enter Room Password</h2>
        <div className="form-group">
          <input 
            type="password" 
            value={joinPassword} 
            onChange={(e) => setJoinPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        <div className="modal-actions">
          <button 
            className="cancel-button" 
            onClick={() => {
              setShowJoinModal(false);
              setJoinPassword('');
              setJoinRoomId(null);
            }}
          >
            Cancel
          </button>
          <button 
            className="confirm-button" 
            onClick={submitJoinPassword}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
  
  const HomeView = () => (
    <div className="home-view">
      {!userName ? (
        <div className="username-setup">
          <h2>Enter Your Name</h2>
          <div className="form-group">
            <input
              type="text"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              placeholder="Your name"
              maxLength={20}
            />
          </div>
          <button 
            className="primary-button"
            onClick={submitUserName}
            disabled={!userNameInput.trim()}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <div className="welcome-message">
            <h2>Welcome, {userName}!</h2>
            <p>Join a room or create your own to start playing.</p>
          </div>
          
          <div className="home-actions">
            <button 
              className="join-button"
              onClick={toggleDropdown}
            >
              Join Room
            </button>
            
            <button 
              className="create-button"
              onClick={() => setCurrentView('create')}
            >
              Create Room
            </button>
          </div>
        </>
      )}
    </div>
  );
  
  const CreateRoomView = () => (
    <div className="create-room-view">
      <div className="view-header">
        <button 
          className="back-button"
          onClick={() => setCurrentView('home')}
        >
          ← Back
        </button>
        <h2>Create Room</h2>
      </div>
      
      <div className="form-container">
        <div className="form-group">
          <label>Team Name</label>
          <input 
            type="text" 
            value={teamName} 
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            maxLength={20}
          />
        </div>
        
        <div className="form-group">
          <label>Password (optional)</label>
          <input 
            type="password" 
            value={roomPassword} 
            onChange={(e) => setRoomPassword(e.target.value)}
            placeholder="Enter room password"
            maxLength={20}
          />
        </div>
        
        <button 
          className="primary-button"
          onClick={createRoom}
          disabled={!teamName.trim()}
        >
          Create Room
        </button>
      </div>
    </div>
  );
  
  const GameView = () => {
    const roomInfo = getCurrentRoomInfo();
    
    if (!roomInfo) {
      return (
        <div className="error-message">
          <p>Room not found. Please return to home.</p>
          <button 
            className="primary-button"
            onClick={() => setCurrentView('home')}
          >
            Go Home
          </button>
        </div>
      );
    }
    
    return (
      <div className="game-view">
        <div className="game-header">
          <div className="room-info">
            <h2>{roomInfo.teamName}</h2>
            {isRoomLeader() && <span className="leader-badge">Leader</span>}
          </div>
          
          <div className="game-actions">
            {isRoomLeader() ? (
              <button className="delete-button" onClick={deleteRoom}>
                Delete Room
              </button>
            ) : (
              <button className="leave-button" onClick={() => leaveRoom(currentRoom)}>
                Leave
              </button>
            )}
          </div>
        </div>
        
        <div className="game-content">
          <div className="counter-display">
            <span className="counter-value">{count}</span>
            <span className="counter-label">Taps</span>
          </div>
          
          <button 
            className="tap-button" 
            onClick={handleButtonTap}
            style={{ transform: `scale(${buttonScale})` }}
          >
            TAP
          </button>
          
          <div className="member-list">
            <h3>Room Members</h3>
            <ul>
              {userStats.map(stat => (
                <li key={stat.userId} className={stat.userId === userId ? 'current-user' : ''}>
                  <span className="member-name">
                    {stat.userName || 'Unknown Player'}
                    {stat.userId === roomInfo.leaderUserId && <span className="crown">👑</span>}
                  </span>
                  <span className="member-taps">{stat.tapCount} taps</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="app">
      {showDropdown && <RoomDropdown />}
      {showJoinModal && <JoinPasswordModal />}
      
      {currentView === 'home' && <HomeView />}
      {currentView === 'create' && <CreateRoomView />}
      {currentView === 'game' && <GameView />}
    </div>
  );
}

export default App;