import React, { useState, useEffect } from 'react';

function TapStatistics() {
  const [teamTapCounts, setTeamTapCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tap counts
  useEffect(() => {
    const fetchTapCounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8080/api/teams/tap-counts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tap counts');
        }
        
        const data = await response.json();
        setTeamTapCounts(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching tap counts:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchTapCounts();

    // Set up interval to fetch every 5 seconds
    const intervalId = setInterval(fetchTapCounts, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px'
      }}>
        Loading tap statistics...
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'red',
        fontSize: '24px'
      }}>
        Error: {error}
      </div>
    );
  }

  // Team colors
  const teamColors = {
    'Team Blue': '#3498db',
    'Team Red': '#e74c3c'
  };

  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '500px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          marginBottom: '30px', 
          color: '#333' 
        }}>
          Team Tap Statistics
        </h1>

        {Object.entries(teamTapCounts).map(([teamName, tapCount]) => (
          <div 
            key={teamName}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: `${teamColors[teamName]}10`,
              padding: '20px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}
          >
            <h2 style={{ 
              color: teamColors[teamName], 
              margin: 0 
            }}>
              {teamName}
            </h2>
            <p style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              color: teamColors[teamName],
              margin: 0 
            }}>
              {tapCount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TapStatistics;