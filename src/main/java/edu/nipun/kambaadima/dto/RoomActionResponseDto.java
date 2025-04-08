package edu.nipun.kambaadima.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomActionResponseDto {
    private boolean success;
    private String message;
    private RoomDto room;
}