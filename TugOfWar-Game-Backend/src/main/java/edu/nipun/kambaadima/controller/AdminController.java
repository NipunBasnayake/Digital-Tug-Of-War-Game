package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.AdminActionDTO;
import edu.nipun.kambaadima.dto.TeamDTO;
import edu.nipun.kambaadima.dto.UserDTO;
import edu.nipun.kambaadima.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final TeamService teamService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/reset-game")
    public ResponseEntity<Map<String, Object>> resetGame() {
        Map<String, Object> result = teamService.resetGame();

        TeamDTO notification = new TeamDTO("System");
        notification.setMessage("Game has been reset by admin");
        messagingTemplate.convertAndSend("/topic/team-updates", notification);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/set-max-team-size")
    public ResponseEntity<Integer> setMaxTeamSize(@RequestBody AdminActionDTO actionDTO) {
        int newMaxSize = teamService.setMaxTeamSize(actionDTO.getMaxTeamSize());

        TeamDTO notification = new TeamDTO("System");
        notification.setMessage("Max team size updated to " + newMaxSize);
        messagingTemplate.convertAndSend("/topic/team-updates", notification);

        return ResponseEntity.ok(newMaxSize);
    }

    @PostMapping("/create-game")
    public ResponseEntity<Map<String, Object>> createGame(@RequestBody AdminActionDTO actionDTO) {
        teamService.resetGame();
        int maxTeamSize = teamService.setMaxTeamSize(actionDTO.getMaxTeamSize());
        teamService.setGameCreated(true);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "Game created successfully");
        result.put("maxTeamSize", maxTeamSize);
        result.put("isGameCreated", true);

        TeamDTO notification = new TeamDTO("System");
        notification.setMessage("Game created with team size " + maxTeamSize);
        messagingTemplate.convertAndSend("/topic/team-updates", notification);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/game-state")
    public ResponseEntity<Map<String, Object>> getGameState() {
        Map<String, Object> state = new HashMap<>();
        state.put("maxTeamSize", teamService.getMaxTeamSize());
        state.put("isGameCreated", teamService.isGameCreated());
        state.put("teamCounts", teamService.getTeamMemberCounts());
        state.put("tapCounts", teamService.getTeamTapCounts());
        state.put("lockStatus", teamService.getTeamLockStatus());

        return ResponseEntity.ok(state);
    }

    @GetMapping("/players")
    public ResponseEntity<Map<String, List<UserDTO>>> getAllPlayers() {
        Map<String, List<UserDTO>> players = new HashMap<>();

        for (Map.Entry<String, TeamDTO> entry : teamService.getTeams().entrySet()) {
            List<UserDTO> activeMembers = entry.getValue().getMembers().stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            players.put(entry.getKey(), activeMembers);
        }

        return ResponseEntity.ok(players);
    }

    @GetMapping("/lock-status")
    public ResponseEntity<Map<String, Boolean>> getTeamLockStatus() {
        return ResponseEntity.ok(teamService.getTeamLockStatus());
    }
}