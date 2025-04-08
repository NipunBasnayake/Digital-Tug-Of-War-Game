package edu.nipun.kambaadima.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserDTO {
    private String id;
    private String username;

    public UserDTO(String username) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
    }
}