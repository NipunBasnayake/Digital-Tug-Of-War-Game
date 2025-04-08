import React from 'react';

function TeamSelection({ username, onJoinTeam, errorMessage }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f0f2f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <h1 style={{ 
          marginBottom: '20px', 
          color: '#333' 
        }}>
          Welcome, {username}!
        </h1>
        <h2 style={{ 
          marginBottom: '30px', 
          color: '#666' 
        }}>
          Choose Your Team
        </h2>
        
        {errorMessage && (
          <p style={{ 
            color: 'red', 
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            {errorMessage}
          </p>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px' 
        }}>
          <button 
            onClick={() => onJoinTeam('Team Blue')}
            style={{ 
              backgroundColor: 'blue', 
              color: 'white', 
              padding: '15px 30px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'darkblue'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'blue'}
          >
            Join Team Blue
          </button>
          <button 
            onClick={() => onJoinTeam('Team Red')}
            style={{ 
              backgroundColor: 'red', 
              color: 'white', 
              padding: '15px 30px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'darkred'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'red'}
          >
            Join Team Red
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamSelection;