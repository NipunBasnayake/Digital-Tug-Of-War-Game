package edu.nipun.kambaadima.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class TeamDTO {
    private String name;
    private List<UserDTO> members = new ArrayList<>();
    private int tapCount = 0;
    private boolean isFull = false;
    private boolean roomLocked = false;
    private String message;
    private Map<String, Integer> teamCounts = new HashMap<>();
    private Map<String, Boolean> lockStatus = new HashMap<>();

    public TeamDTO(String name) {
        this.name = name;
    }

    public void addMember(UserDTO user) {
        if (members.size() < 4 && !roomLocked) {
            members.add(user);
            isFull = members.size() >= 4;

            if (members.size() >= 4) {
                roomLocked = true;
            }
        }
    }

    public void incrementTapCount() {
        tapCount++;
    }

    // Helper method to set team counts
    public void setTeamCount(String teamName, int count) {
        teamCounts.put(teamName, count);
    }

    // Helper method to set lock status
    public void setTeamLockStatus(String teamName, boolean locked) {
        lockStatus.put(teamName, locked);
    }
}