package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.*;
import edu.nipun.kambaadima.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<RoomDto>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{roomName}")
    public ResponseEntity<RoomDto> getRoomByName(@PathVariable String roomName) {
        RoomDto room = roomService.getRoomByName(roomName);
        if (room == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(room);
    }

    @PostMapping("/create")
    public ResponseEntity<RoomActionResponseDto> createRoom(@RequestBody CreateRoomRequestDto request) {
        RoomActionResponseDto response = roomService.createRoom(request);

        // Broadcast that a new room was created
        if (response.isSuccess()) {
            messagingTemplate.convertAndSend("/topic/rooms", response.getRoom());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomActionResponseDto> joinRoom(@RequestBody JoinRoomRequestDto request) {
        RoomActionResponseDto response = roomService.joinRoom(request);

        // Broadcast room update to all clients
        if (response.isSuccess() && response.getRoom() != null) {
            messagingTemplate.convertAndSend("/topic/rooms/" + request.getRoomName(), response.getRoom());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/leave")
    public ResponseEntity<RoomActionResponseDto> leaveRoom(@RequestBody JoinRoomRequestDto request) {
        RoomActionResponseDto response = roomService.leaveRoom(request);

        // Broadcast room update to all clients if the room still exists
        if (response.isSuccess() && response.getRoom() != null) {
            messagingTemplate.convertAndSend("/topic/rooms/" + request.getRoomName(), response.getRoom());
        }

        return ResponseEntity.ok(response);
    }
}