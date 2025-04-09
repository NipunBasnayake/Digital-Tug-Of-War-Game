package edu.nipun.kambaadima.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class UserDTO {
    private String id;
    private String username;

    public UserDTO(String username) {
        this.id = UUID.randomUUID().toString();
        this.username = username;
    }
}