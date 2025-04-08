package edu.nipun.kambaadima.service.impl;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TeamServiceImpl implements TeamService {
    private final Map<String, TeamDTO> teams = new ConcurrentHashMap<>();
    private static final int MAX_TEAM_SIZE = 4;

    public TeamServiceImpl() {
        // Initialize teams
        teams.put("Team Blue", new TeamDTO("Team Blue"));
        teams.put("Team Red", new TeamDTO("Team Red"));
    }

    @Override
    public TeamDTO joinTeam(String teamName, UserDTO user) {
        TeamDTO team = teams.get(teamName);

        if (team == null) {
            throw new IllegalArgumentException("Team not found: " + teamName);
        }

        if (team.getMembers().size() >= MAX_TEAM_SIZE) {
            team.setMessage("Team is full");
            team.setRoomLocked(true); // Set room as locked
            return team;
        }

        team.addMember(user);
        team.setMessage(user.getUsername() + " joined " + teamName);

        if (team.getMembers().size() == MAX_TEAM_SIZE) {
            team.setRoomLocked(true); // Lock the room when it reaches exactly 4 members
            team.setMessage("Team " + teamName + " is now full and locked");
        }

        return team;
    }

    @Override
    public TeamDTO tap(String teamName) {
        TeamDTO team = teams.get(teamName);

        if (team == null) {
            throw new IllegalArgumentException("Team not found: " + teamName);
        }

        team.incrementTapCount();
        return team;
    }

    @Override
    public Map<String, Integer> getTeamTapCounts() {
        Map<String, Integer> tapCounts = new HashMap<>();
        for (Map.Entry<String, TeamDTO> entry : teams.entrySet()) {
            tapCounts.put(entry.getKey(), entry.getValue().getTapCount());
        }
        return tapCounts;
    }

    @Override
    public Map<String, Integer> getTeamMemberCounts() {
        Map<String, Integer> memberCounts = new HashMap<>();
        for (Map.Entry<String, TeamDTO> entry : teams.entrySet()) {
            memberCounts.put(entry.getKey(), entry.getValue().getMembers().size());
        }
        return memberCounts;
    }

    @Override
    public Map<String, Boolean> getTeamLockStatus() {
        Map<String, Boolean> lockStatus = new HashMap<>();
        for (Map.Entry<String, TeamDTO> entry : teams.entrySet()) {
            lockStatus.put(entry.getKey(), entry.getValue().isRoomLocked());
        }
        return lockStatus;
    }
}