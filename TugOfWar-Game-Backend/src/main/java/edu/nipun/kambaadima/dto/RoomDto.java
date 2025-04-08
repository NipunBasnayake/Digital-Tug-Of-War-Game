package edu.nipun.kambaadima.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private Long id;
    private String name;
    private String teamName;
    private String leaderUserId;
    private Integer currentCount;
    private Integer userCount;
    private List<String> userIds;
    private boolean isFull;
    private boolean passwordProtected;
}