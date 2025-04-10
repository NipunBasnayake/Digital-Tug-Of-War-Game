package edu.nipun.kambaadima.dto;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@Getter
@Setter
public class TeamDTO {
    private String teamName;
    private List<UserDTO> members;
    private int tapCount;
    private String message;
    private boolean roomLocked;
    private Map<String, Integer> teamCounts;
    private Map<String, Boolean> lockStatus;
    private int maxMembers;
    
    public TeamDTO(String teamName) {
        this.teamName = teamName;
        this.members = new ArrayList<>();
        this.tapCount = 0;
        this.message = "";
        this.roomLocked = false;
        this.teamCounts = new HashMap<>();
        this.lockStatus = new HashMap<>();
        this.maxMembers = 4;
    }

    public TeamDTO(String teamName, int maxMembers) {
        this(teamName);
        this.maxMembers = maxMembers;
        initializeEmptySlots();
    }

    public void setMaxMembers(int maxMembers) {
        this.maxMembers = maxMembers;
        initializeEmptySlots();
    }

    private void initializeEmptySlots() {
        this.members = new ArrayList<>(maxMembers);
        for (int i = 0; i < maxMembers; i++) {
            this.members.add(null);
        }
    }

    public void addMember(UserDTO user) {
        if (user == null) {
            return;
        }
        user.setId(UUID.randomUUID().toString());
        for (int i = 0; i < members.size(); i++) {
            if (members.get(i) == null) {
                members.set(i, user);
                return;
            }
        }
        if (members.size() < maxMembers) {
            members.add(user);
        }
    }

    public void removeMember(String username) {
        if (username == null || username.isEmpty()) {
            return;
        }
        for (int i = 0; i < members.size(); i++) {
            UserDTO member = members.get(i);
            if (member != null && member.getUsername().equals(username)) {
                members.set(i, null);
                return;
            }
        }
    }

    public int getActiveMembers() {
        int count = 0;
        for (UserDTO member : members) {
            if (member != null) {
                count++;
            }
        }
        return count;
    }

    public void incrementTapCount() {
        this.tapCount++;
    }

    public void setTeamCount(String teamName, Integer count) {
        if (this.teamCounts == null) {
            this.teamCounts = new HashMap<>();
        }
        this.teamCounts.put(teamName, count);
    }

    public void setTeamLockStatus(String teamName, Boolean isLocked) {
        if (this.lockStatus == null) {
            this.lockStatus = new HashMap<>();
        }
        this.lockStatus.put(teamName, isLocked);
    }
}