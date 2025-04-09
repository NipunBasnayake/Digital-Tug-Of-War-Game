package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.JoinRequestDTO;
import edu.nipun.kambaadima.dto.TapRequestDTO;
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
    public TeamDTO joinTeam(JoinRequestDTO request) {
        UserDTO user = new UserDTO(request.getUsername());
        TeamDTO team = teamService.joinTeam(request.getTeamName(), user);

        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            team.setTeamCount(entry.getKey(), entry.getValue());
        }

        Map<String, Boolean> lockStatus = teamService.getTeamLockStatus();
        for (Map.Entry<String, Boolean> entry : lockStatus.entrySet()) {
            team.setTeamLockStatus(entry.getKey(), entry.getValue());
        }

        Map<String, Integer> tapCounts = teamService.getTeamTapCounts();

        return team;
    }

    @MessageMapping("/tap")
    @SendTo("/topic/team-updates")
    public TeamDTO tap(TapRequestDTO request) {
        TeamDTO team = teamService.tap(request.getTeamName());

        team.setTeamName(request.getTeamName());

        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            team.setTeamCount(entry.getKey(), entry.getValue());
        }

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

        Map<String, Integer> teamCounts = teamService.getTeamMemberCounts();
        for (Map.Entry<String, Integer> entry : teamCounts.entrySet()) {
            teamDTO.setTeamCount(entry.getKey(), entry.getValue());
        }

        Map<String, Boolean> lockStatus = teamService.getTeamLockStatus();
        for (Map.Entry<String, Boolean> entry : lockStatus.entrySet()) {
            teamDTO.setTeamLockStatus(entry.getKey(), entry.getValue());
        }

        return teamDTO;
    }
}