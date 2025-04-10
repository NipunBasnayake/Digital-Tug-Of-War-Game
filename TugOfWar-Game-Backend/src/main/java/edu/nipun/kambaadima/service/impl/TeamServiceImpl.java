package edu.nipun.kambaadima.service.impl;
import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import lombok.Getter;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class TeamServiceImpl implements TeamService {
    @Getter
    private final Map<String, TeamDTO> teams = new ConcurrentHashMap<>();
    private static final int MAX_TEAM_SIZE = 1; // Fixed team size

    public TeamServiceImpl() {
        teams.put("Team Blue", new TeamDTO("Team Blue", MAX_TEAM_SIZE));
        teams.put("Team Red", new TeamDTO("Team Red", MAX_TEAM_SIZE));
    }

    @Override
    public TeamDTO joinTeam(String teamName, UserDTO user) {
        TeamDTO team = teams.get(teamName);
        if (team == null) {
            throw new IllegalArgumentException("Team not found: " + teamName);
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
    public int getMaxTeamSize() {
        return MAX_TEAM_SIZE;
    }

    @Override
    public Map<String, Object> getAllTeamData() {
        Map<String, Object> result = new HashMap<>();
        result.put("memberCounts", getTeamMemberCounts());
        result.put("tapCounts", getTeamTapCounts());
        result.put("lockStatus", getTeamLockStatus());
        result.put("maxTeamSize", MAX_TEAM_SIZE);
        result.put("teams", teams);
        return result;
    }
}