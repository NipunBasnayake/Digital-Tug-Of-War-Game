package edu.nipun.kambaadima.service;

import edu.nipun.kambaadima.dto.CreateRoomRequestDto;
import edu.nipun.kambaadima.dto.JoinRoomRequestDto;
import edu.nipun.kambaadima.dto.RoomActionResponseDto;
import edu.nipun.kambaadima.dto.RoomDto;

import java.util.List;

public interface RoomService {
    List<RoomDto> getAllRooms();
    RoomDto getRoomByName(String roomName);
    RoomActionResponseDto createRoom(CreateRoomRequestDto request);
    RoomActionResponseDto joinRoom(JoinRoomRequestDto request);
    RoomActionResponseDto leaveRoom(JoinRoomRequestDto request);
    void initializeRoomsIfNeeded();
}
