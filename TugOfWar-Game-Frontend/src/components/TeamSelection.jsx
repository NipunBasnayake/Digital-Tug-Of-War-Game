import React, { useState, useEffect } from 'react';
import './TeamSelection.css';

const TeamSelection = ({ username, onJoinTeam, teamCounts = {} }) => {
  const [disabledButtons, setDisabledButtons] = useState({
    'Team Blue': false,
    'Team Red': false
  });
  
  const blueCount = teamCounts['Team Blue'] || 0;
  const redCount = teamCounts['Team Red'] || 0;
  
  const isTeamBlueFull = blueCount >= 4;
  const isTeamRedFull = redCount >= 4;

  useEffect(() => {
    if (isTeamBlueFull && !disabledButtons['Team Blue']) {
      const timer = setTimeout(() => {
        setDisabledButtons(prev => ({
          ...prev,
          'Team Blue': true
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!isTeamBlueFull && disabledButtons['Team Blue']) {
      setDisabledButtons(prev => ({
        ...prev,
        'Team Blue': false
      }));
    }
  }, [isTeamBlueFull, disabledButtons]);
  
  useEffect(() => {
    if (isTeamRedFull && !disabledButtons['Team Red']) {
      const timer = setTimeout(() => {
        setDisabledButtons(prev => ({
          ...prev,
          'Team Red': true
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (!isTeamRedFull && disabledButtons['Team Red']) {
      setDisabledButtons(prev => ({
        ...prev,
        'Team Red': false
      }));
    }
  }, [isTeamRedFull, disabledButtons]);

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

export default TeamSelection;