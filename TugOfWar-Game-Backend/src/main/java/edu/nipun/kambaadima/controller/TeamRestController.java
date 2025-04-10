package edu.nipun.kambaadima.controller;
import edu.nipun.kambaadima.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
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

    @GetMapping("/all-counts")
    public Map<String, Object> getAllCounts() {
        Map<String, Object> result = new HashMap<>();
        result.put("tapCounts", teamService.getTeamTapCounts());
        result.put("memberCounts", teamService.getTeamMemberCounts());
        result.put("lockStatus", teamService.getTeamLockStatus());
        result.put("maxTeamSize", teamService.getMaxTeamSize());
        return result;
    }

    @GetMapping("/all-data")
    public Map<String, Object> getAllTeamData() {
        return teamService.getAllTeamData();
    }
}