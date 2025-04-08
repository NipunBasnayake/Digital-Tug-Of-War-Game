package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeamRestController {
    private final TeamService teamService;

    @GetMapping("/tap-counts")
    public Map<String, Integer> getTeamTapCounts() {
        return teamService.getTeamTapCounts();
    }

    @GetMapping("/team-members")
    public Map<String, Integer> getTeamMemberCounts() {
        return teamService.getTeamMemberCounts();
    }
}