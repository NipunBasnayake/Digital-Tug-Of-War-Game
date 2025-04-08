package edu.nipun.kambaadima.service.impl;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class TeamServiceImpl implements TeamService {
    private final Map<String, TeamDTO> teams = new HashMap<>();

    public TeamServiceImpl() {
        // Initialize teams
        teams.put("Team Blue", new TeamDTO("Team Blue"));
        teams.put("Team Red", new TeamDTO("Team Red"));
    }

    public TeamDTO joinTeam(String teamName, UserDTO user) {
        TeamDTO team = teams.get(teamName);

        if (team.isFull()) {
            TeamDTO fullTeam = new TeamDTO(teamName);
            fullTeam.setMessage("Team is full");
            return fullTeam;
        }

        team.addMember(user);

        TeamDTO updatedTeam = new TeamDTO(teamName);
        updatedTeam.setMembers(team.getMembers());
        updatedTeam.setTapCount(team.getTapCount());
        updatedTeam.setMessage("User " + user.getUsername() + " joined the team");

        return updatedTeam;
    }

    public TeamDTO tap(String teamName) {
        TeamDTO team = teams.get(teamName);
        team.incrementTapCount();

        TeamDTO updatedTeam = new TeamDTO(teamName);
        updatedTeam.setMembers(team.getMembers());
        updatedTeam.setTapCount(team.getTapCount());
        updatedTeam.setMessage("Tap registered");

        return updatedTeam;
    }

    public Map<String, Integer> getTeamTapCounts() {
        Map<String, Integer> tapCounts = new HashMap<>();
        teams.forEach((name, team) -> tapCounts.put(name, team.getTapCount()));
        return tapCounts;
    }

    public Map<String, Integer> getTeamMemberCounts() {
        Map<String, Integer> memberCounts = new HashMap<>();
        teams.forEach((name, team) -> memberCounts.put(name, team.getMembers().size()));
        return memberCounts;
    }
}