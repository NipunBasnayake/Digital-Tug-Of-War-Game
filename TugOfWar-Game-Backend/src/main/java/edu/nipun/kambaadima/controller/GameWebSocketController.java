package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {
    private final TeamService teamService;

    @MessageMapping("/join")
    @SendTo("/topic/team-updates")
    public TeamDTO joinTeam(JoinRequest request) {
        UserDTO user = new UserDTO(request.getUsername());
        TeamDTO team = teamService.joinTeam(request.getTeamName(), user);

        // Set team name in response for UI to know which team was updated
        team.setTeamName(request.getTeamName());

        // Set team counts
        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            team.setTeamCount(entry.getKey(), entry.getValue());
        }

        // Set lock status
        Map<String, Boolean> lockStatus = teamService.getTeamLockStatus();
        for (Map.Entry<String, Boolean> entry : lockStatus.entrySet()) {
            team.setTeamLockStatus(entry.getKey(), entry.getValue());
        }

        // Also include the tap counts for both teams
        Map<String, Integer> tapCounts = teamService.getTeamTapCounts();

        return team;
    }

    @MessageMapping("/tap")
    @SendTo("/topic/team-updates")
    public TeamDTO tap(TapRequest request) {
        TeamDTO team = teamService.tap(request.getTeamName());

        // Set team name in response for UI to know which team was updated
        team.setTeamName(request.getTeamName());

        // Set team counts
        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            team.setTeamCount(entry.getKey(), entry.getValue());
        }

        // Set lock status
        Map<String, Boolean> lockStatus = teamService.getTeamLockStatus();
        for (Map.Entry<String, Boolean> entry : lockStatus.entrySet()) {
            team.setTeamLockStatus(entry.getKey(), entry.getValue());
        }

        return team;
    }

    @MessageMapping("/get-team-counts")
    @SendTo("/topic/team-updates")
    public TeamDTO getTeamCounts() {
        TeamDTO teamDTO = new TeamDTO("Counts");
        teamDTO.setMessage("Team counts update");

        // Set team counts
        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            teamDTO.setTeamCount(entry.getKey(), entry.getValue());
        }

        // Set lock status
        Map<String, Boolean> lockStatus = teamService.getTeamLockStatus();
        for (Map.Entry<String, Boolean> entry : lockStatus.entrySet()) {
            teamDTO.setTeamLockStatus(entry.getKey(), entry.getValue());
        }

        return teamDTO;
    }

    public static class JoinRequest {
        private String username;
        private String teamName;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }
    }

    public static class TapRequest {
        private String teamName;

        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }
    }
}