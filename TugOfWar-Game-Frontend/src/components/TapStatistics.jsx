import React, { useState, useEffect } from 'react';

function TapStatistics() {
  const [teamTapCounts, setTeamTapCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);


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
        setLastUpdated(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching tap counts:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchTapCounts();

    const intervalId = setInterval(fetchTapCounts, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const teamColors = {
    'Team Blue': { main: '#3498db', gradient: 'linear-gradient(135deg, #3498db, #2980b9)' },
    'Team Red': { main: '#e74c3c', gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)' }
  };
  
  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading tap statistics...</p>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        p {
          font-size: 1.2rem;
          color: white;
          margin: 0;
        }
      `}</style>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="error-container">
      <div className="error-icon">!</div>
      <h2>Error Loading Data</h2>
      <p>{error}</p>
      
      <style jsx>{`
        .error-container {
          background-color: rgba(255, 255, 255, 0.9);
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          max-width: 400px;
        }
        
        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          background-color: #e74c3c;
          color: white;
          font-size: 2.5rem;
          font-weight: bold;
          border-radius: 50%;
          margin: 0 auto 1rem;
        }
        
        h2 {
          color: #e74c3c;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        p {
          color: #333;
          margin: 0;
        }
      `}</style>
    </div>
  );

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="stats-container">
      {isLoading && !teamTapCounts.length ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorDisplay />
      ) : (
        <div className="stats-card">
          <h1 className="stats-title">Team Tap Statistics</h1>
          
          <div className="teams-container">
            {Object.entries(teamTapCounts).map(([teamName, tapCount]) => (
              <div 
                key={teamName}
                className="team-stat-item"
                style={{
                  background: teamColors[teamName].gradient
                }}
              >
                <div className="team-info">
                  <h2 className="team-name">{teamName}</h2>
                  <div className="team-count">{tapCount}</div>
                </div>
                
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, (tapCount / 1000) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="last-updated">
            Last updated: {formatTime(lastUpdated)}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .stats-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          font-family: 'Arial', sans-serif;
          padding: 1rem;
        }
        
        .stats-card {
          background-color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
          width: 90%;
          max-width: 600px;
          animation: fadeIn 0.5s ease;
        }
        
        .stats-title {
          text-align: center;
          color: #2d3436;
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.8rem;
        }
        
        .teams-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .team-stat-item {
          border-radius: 12px;
          padding: 1.5rem;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .team-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .team-name {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
        }
        
        .team-count {
          font-size: 2.2rem;
          font-weight: 700;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50px;
          padding: 0.2rem 1rem;
          min-width: 80px;
          text-align: center;
        }
        
        .progress-bar-container {
          height: 10px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 5px;
          transition: width 0.5s ease;
        }
        
        .last-updated {
          text-align: center;
          font-size: 0.9rem;
          color: #7f8c8d;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 500px) {
          .stats-card {
            padding: 1.5rem;
          }
          
          .team-info {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
          
          .team-count {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default TapStatistics;