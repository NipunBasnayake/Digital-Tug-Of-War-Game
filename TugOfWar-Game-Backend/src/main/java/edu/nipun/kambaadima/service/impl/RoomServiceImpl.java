package edu.nipun.kambaadima.service.impl;

import edu.nipun.kambaadima.dto.*;
import edu.nipun.kambaadima.entity.Room;
import edu.nipun.kambaadima.repository.RoomRepository;
import edu.nipun.kambaadima.service.RoomService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    @PostConstruct
    public void init() {
//        initializeRoomsIfNeeded();
    }

    @Override
    public void initializeRoomsIfNeeded() {
        if (roomRepository.count() == 0) {
            // Create default room with no password
            Room room1 = Room.builder()
                    .name("Public Room")
                    .teamName("Public Team")
                    .currentCount(0)
                    .userCount(0)
                    .build();
            roomRepository.save(room1);
        }
    }

    @Override
    public List<RoomDto> getAllRooms() {
        return roomRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public RoomDto getRoomByName(String roomName) {
        return roomRepository.findByName(roomName)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Override
    @Transactional
    public RoomActionResponseDto createRoom(CreateRoomRequestDto request) {
        // Generate a unique name for the room
        String roomName = "Room-" + UUID.randomUUID().toString().substring(0, 8);

        Room room = Room.builder()
                .name(roomName)
                .teamName(request.getTeamName())
                .password(request.getPassword())
                .leaderUserId(request.getUserId())
                .currentCount(0)
                .userCount(0)
                .build();

        // Add the creator to the room
        room.addUser(request.getUserId());
        room.setUserCount(1);

        roomRepository.save(room);

        return RoomActionResponseDto.builder()
                .success(true)
                .message("Room created successfully")
                .room(mapToDto(room))
                .build();
    }

    @Override
    @Transactional
    public RoomActionResponseDto joinRoom(JoinRoomRequestDto request) {
        Optional<Room> roomOpt = roomRepository.findByName(request.getRoomName());

        if (roomOpt.isEmpty()) {
            return RoomActionResponseDto.builder()
                    .success(false)
                    .message("Room not found")
                    .build();
        }

        Room room = roomOpt.get();

        // Check if password is needed and correct
        if (room.getPassword() != null && !room.getPassword().isEmpty()) {
            if (request.getPassword() == null || !request.getPassword().equals(room.getPassword())) {
                return RoomActionResponseDto.builder()
                        .success(false)
                        .message("Incorrect password")
                        .build();
            }
        }

        if (room.isFull() && !room.getUserIds().contains(request.getUserId())) {
            return RoomActionResponseDto.builder()
                    .success(false)
                    .message("Room is full")
                    .room(mapToDto(room))
                    .build();
        }

        boolean added = room.addUser(request.getUserId());
        room.setUserCount(room.getUserIds().size());
        roomRepository.save(room);

        return RoomActionResponseDto.builder()
                .success(added)
                .message(added ? "Joined room successfully" : "Already in room or room is full")
                .room(mapToDto(room))
                .build();
    }

    @Override
    @Transactional
    public RoomActionResponseDto leaveRoom(JoinRoomRequestDto request) {
        Optional<Room> roomOpt = roomRepository.findByName(request.getRoomName());

        if (roomOpt.isEmpty()) {
            return RoomActionResponseDto.builder()
                    .success(false)
                    .message("Room not found")
                    .build();
        }

        Room room = roomOpt.get();
        boolean removed = room.removeUser(request.getUserId());

        // If user was the leader and there are still people in the room, assign a new leader
        if (removed && room.isLeader(request.getUserId()) && !room.getUserIds().isEmpty()) {
            room.setLeaderUserId(room.getUserIds().get(0));
        }

        // If room is now empty and it's not the public room, delete it
        if (room.getUserIds().isEmpty() && (room.getLeaderUserId() != null)) {
            roomRepository.delete(room);
            return RoomActionResponseDto.builder()
                    .success(true)
                    .message("Left room and room was deleted because it's empty")
                    .build();
        } else {
            room.setUserCount(room.getUserIds().size());
            roomRepository.save(room);

            return RoomActionResponseDto.builder()
                    .success(removed)
                    .message(removed ? "Left room successfully" : "Not in room")
                    .room(mapToDto(room))
                    .build();
        }
    }

    private RoomDto mapToDto(Room room) {
        return RoomDto.builder()
                .id(room.getId())
                .name(room.getName())
                .teamName(room.getTeamName())
                .leaderUserId(room.getLeaderUserId())
                .currentCount(room.getCurrentCount())
                .userCount(room.getUserIds().size())
                .userIds(room.getUserIds())
                .isFull(room.isFull())
                .passwordProtected(room.getPassword() != null && !room.getPassword().isEmpty())
                .build();
    }
}