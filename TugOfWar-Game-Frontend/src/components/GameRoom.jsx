import React from 'react';

function GameRoom({ teamName, username, members, tapCount, onTap }) {
  // Determine team color
  const teamColor = teamName === 'Team Blue' ? '#3498db' : '#e74c3c';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '500px'
      }}>
        <h1 style={{ 
          color: teamColor, 
          marginBottom: '20px' 
        }}>
          {teamName} Game Room
        </h1>

        {/* Team Members Section */}
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: `${teamColor}10`, // Light transparent background
          padding: '20px',
          borderRadius: '5px'
        }}>
          <h2 style={{ 
            color: teamColor, 
            marginBottom: '15px' 
          }}>
            Team Members
          </h2>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px'
          }}>
            {members.map((member) => (
              <li 
                key={member.id}
                style={{
                  backgroundColor: member.username === username ? teamColor : `${teamColor}50`,
                  color: 'white',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  fontWeight: member.username === username ? 'bold' : 'normal'
                }}
              >
                {member.username} 
                {member.username === username ? ' (You)' : ''}
              </li>
            ))}
          </ul>
        </div>

        {/* Tap Section */}
        <div>
          <h2 style={{ 
            color: teamColor, 
            marginBottom: '20px' 
          }}>
            Team Tap Count: {tapCount}
          </h2>
          
          <button 
            onClick={onTap}
            style={{
              backgroundColor: teamColor,
              color: 'white',
              padding: '20px 40px',
              fontSize: '24px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}
            onMouseDown={(e) => {
              e.target.style.transform = 'scale(0.95)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            }}
          >
            TAP
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameRoom;