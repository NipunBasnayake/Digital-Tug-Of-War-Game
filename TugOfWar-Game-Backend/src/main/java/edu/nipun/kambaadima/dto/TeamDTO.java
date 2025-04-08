package edu.nipun.kambaadima.dto;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class TeamDTO {
    private String name;
    private List<UserDTO> members = new ArrayList<>();
    private int tapCount = 0;
    private boolean isFull = false;
    private String message;

    public TeamDTO(String name) {
        this.name = name;
    }

    public void addMember(UserDTO user) {
        if (members.size() < 4) {
            members.add(user);
            isFull = members.size() >= 4;
        }
    }

    public void incrementTapCount() {
        tapCount++;
    }
}