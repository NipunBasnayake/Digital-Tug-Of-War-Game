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