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
public class CountResponseDto {
    private int count;
    private String roomName;
    private List<UserStatsDto> userStats;
    private String message;
}