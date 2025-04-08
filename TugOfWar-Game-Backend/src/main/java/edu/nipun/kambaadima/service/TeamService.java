package edu.nipun.kambaadima.service;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;

import java.util.Map;

public interface TeamService {
    TeamDTO joinTeam(String teamName, UserDTO user);
    Map<String, Integer> getTeamTapCounts();
    Map<String, Integer> getTeamMemberCounts();
    TeamDTO tap(String teamName);
}