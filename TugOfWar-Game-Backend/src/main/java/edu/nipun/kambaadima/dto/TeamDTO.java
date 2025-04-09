package edu.nipun.kambaadima.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class TeamDTO {
    private String teamName;
    private List<UserDTO> members;
    private int tapCount;
    private String message;
    private boolean roomLocked;
    private Map<String, Integer> teamCounts;
    private Map<String, Boolean> lockStatus;

    public TeamDTO(String teamName) {
        this.teamName = teamName;
        this.members = new ArrayList<>();
        this.tapCount = 0;
        this.message = "";
        this.roomLocked = false;
        this.teamCounts = new HashMap<>();
        this.lockStatus = new HashMap<>();
    }

    public void addMember(UserDTO user) {
        user.setId(UUID.randomUUID().toString());
        this.members.add(user);
    }

    public void incrementTapCount() {
        this.tapCount++;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public List<UserDTO> getMembers() {
        return members;
    }

    public void setMembers(List<UserDTO> members) {
        this.members = members;
    }

    public int getTapCount() {
        return tapCount;
    }

    public void setTapCount(int tapCount) {
        this.tapCount = tapCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRoomLocked() {
        return roomLocked;
    }

    public void setRoomLocked(boolean roomLocked) {
        this.roomLocked = roomLocked;
    }

    public Map<String, Integer> getTeamCounts() {
        return teamCounts;
    }

    public void setTeamCount(String teamName, Integer count) {
        if (this.teamCounts == null) {
            this.teamCounts = new HashMap<>();
        }
        this.teamCounts.put(teamName, count);
    }

    public Map<String, Boolean> getLockStatus() {
        return lockStatus;
    }

    public void setTeamLockStatus(String teamName, Boolean isLocked) {
        if (this.lockStatus == null) {
            this.lockStatus = new HashMap<>();
        }
        this.lockStatus.put(teamName, isLocked);
    }
}