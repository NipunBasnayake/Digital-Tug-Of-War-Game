package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {
    private final TeamService teamService;

    @MessageMapping("/join")
    @SendTo("/topic/team-updates")
    public TeamDTO joinTeam(JoinRequest request) {
        // Create user and attempt to join team
        UserDTO user = new UserDTO(request.getUsername());
        TeamDTO team = teamService.joinTeam(request.getTeamName(), user);

        return team;
    }

    @MessageMapping("/tap")
    @SendTo("/topic/team-updates")
    public TeamDTO tap(TapRequest request) {
        // Increment tap count for the team
        return teamService.tap(request.getTeamName());
    }

    // Inner classes for request DTOs
    public static class JoinRequest {
        private String username;
        private String teamName;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }
    }

    public static class TapRequest {
        private String teamName;

        // Getters and setters
        public String getTeamName() { return teamName; }
        public void setTeamName(String teamName) { this.teamName = teamName; }
    }
}