package edu.nipun.kambaadima.service.impl;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {
    @Getter
    private final Map<String, TeamDTO> teams = new ConcurrentHashMap<>();
    private static int MAX_TEAM_SIZE = 0;
    private boolean gameCreated = false;

    public TeamServiceImpl() {
        teams.put("Team Blue", new TeamDTO("Team Blue"));
        teams.put("Team Red", new TeamDTO("Team Red"));
    }

    @Override
    public TeamDTO joinTeam(String teamName, UserDTO user) {
        TeamDTO team = teams.get(teamName);
        if (team == null) {
            throw new IllegalArgumentException("Team not found: " + teamName);
        }

        if (!gameCreated || MAX_TEAM_SIZE == 0) {
            team.setMessage("Game not created yet. Please wait for an admin to create a game.");
            return team;
        }

        if (team.getActiveMembers() >= MAX_TEAM_SIZE) {
            team.setMessage("Team is full");
            team.setRoomLocked(true);
            return team;
        }

        team.addMember(user);
        team.setMessage(user.getUsername() + " joined " + teamName);

        if (team.getActiveMembers() == MAX_TEAM_SIZE) {
            team.setRoomLocked(true);
            team.setMessage("Team " + teamName + " is now full and locked");
        }

        return team;
    }

    @Override
    public TeamDTO leaveTeam(String teamName, String username) {
        TeamDTO team = teams.get(teamName);
        if (team == null) {
            throw new IllegalArgumentException("Team not found: " + teamName);
        }

        team.removeMember(username);
        team.setMessage(username + " left the team " + teamName);

        if (team.isRoomLocked() && team.getActiveMembers() < MAX_TEAM_SIZE) {
            team.setRoomLocked(false);
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
        return teams.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().getTapCount()
                ));
    }

    @Override
    public Map<String, Integer> getTeamMemberCounts() {
        return teams.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().getActiveMembers()
                ));
    }

    @Override
    public Map<String, Boolean> getTeamLockStatus() {
        return teams.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().isRoomLocked()
                ));
    }

    @Override
    public int setMaxTeamSize(int maxTeamSize) {
        if (maxTeamSize < 1) {
            throw new IllegalArgumentException("Max team size must be at least 1");
        }

        MAX_TEAM_SIZE = maxTeamSize;

        teams.values().forEach(team -> {
            team.setMaxMembers(maxTeamSize);

            if (team.getActiveMembers() >= MAX_TEAM_SIZE) {
                team.setRoomLocked(true);
            } else if (team.isRoomLocked() && team.getActiveMembers() < MAX_TEAM_SIZE) {
                team.setRoomLocked(false);
            }
        });

        return MAX_TEAM_SIZE;
    }

    @Override
    public Map<String, Object> resetGame() {
        teams.clear();
        teams.put("Team Blue", new TeamDTO("Team Blue", MAX_TEAM_SIZE));
        teams.put("Team Red", new TeamDTO("Team Red", MAX_TEAM_SIZE));
        gameCreated = false;

        Map<String, Object> result = new HashMap<>();
        result.put("status", "Game reset successfully");
        result.put("teams", teams.keySet());
        return result;
    }

    @Override
    public int getMaxTeamSize() {
        return MAX_TEAM_SIZE;
    }

    @Override
    public boolean isGameCreated() {
        return gameCreated;
    }

    @Override
    public void setGameCreated(boolean isCreated) {
        this.gameCreated = isCreated;
    }

}