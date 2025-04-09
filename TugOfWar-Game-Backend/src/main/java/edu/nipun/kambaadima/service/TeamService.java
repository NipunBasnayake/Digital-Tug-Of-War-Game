package edu.nipun.kambaadima.service;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import java.util.Map;

public interface TeamService {
    TeamDTO joinTeam(String teamName, UserDTO user);
    TeamDTO tap(String teamName);
    Map<String, Integer> getTeamTapCounts();
    Map<String, Integer> getTeamMemberCounts();
    Map<String, Boolean> getTeamLockStatus();
    TeamDTO leaveTeam(String teamName, String username);

    // Admin functions
    int setMaxTeamSize(int maxTeamSize);
    Map<String, Object> resetGame();
    int getMaxTeamSize();
    boolean isGameCreated();
    void setGameCreated(boolean isCreated);
    Map<String, TeamDTO> getTeams();

}