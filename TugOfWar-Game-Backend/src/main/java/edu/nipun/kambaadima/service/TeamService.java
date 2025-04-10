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

    Map<String, TeamDTO> getTeams();

    int getMaxTeamSize();

    Map<String, Object> getAllTeamData();
}