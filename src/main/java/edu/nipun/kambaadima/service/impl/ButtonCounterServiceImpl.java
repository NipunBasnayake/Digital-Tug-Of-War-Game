package edu.nipun.kambaadima.service.impl;

import edu.nipun.kambaadima.dto.ButtonTapDto;
import edu.nipun.kambaadima.dto.CountResponseDto;
import edu.nipun.kambaadima.dto.UserStatsDto;
import edu.nipun.kambaadima.entity.ButtonRecord;
import edu.nipun.kambaadima.entity.Room;
import edu.nipun.kambaadima.repository.ButtonRecordRepository;
import edu.nipun.kambaadima.repository.RoomRepository;
import edu.nipun.kambaadima.service.ButtonCounterService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ButtonCounterServiceImpl implements ButtonCounterService {

    private final ButtonRecordRepository buttonRecordRepository;
    private final RoomRepository roomRepository;

    @Override
    @Transactional
    public CountResponseDto incrementAndGetCount(ButtonTapDto tapDto) {
        String roomName = tapDto.getRoomName();
        if (roomName == null || roomName.isEmpty()) {
            roomName = "Room 1"; // Default room
        }

        Optional<Room> roomOpt = roomRepository.findByName(roomName);
        if (roomOpt.isEmpty()) {
            return createCountResponse(0, roomName, new ArrayList<>(), "Room not found");
        }

        Room room = roomOpt.get();

        // Check if user is in the room
        if (!room.getUserIds().contains(tapDto.getUserId())) {
            Integer currentCount = room.getCurrentCount() != null ? room.getCurrentCount() : 0;
            return createCountResponse(currentCount, roomName, new ArrayList<>(), "User not in room");
        }

        // Initialize currentCount if null
        if (room.getCurrentCount() == null) {
            room.setCurrentCount(0);
        }

        room.setCurrentCount(room.getCurrentCount() + 1);
        roomRepository.save(room);

        ButtonRecord buttonRecord = ButtonRecord.builder()
                .userId(tapDto.getUserId())
                .roomName(roomName)
                .timestamp(LocalDateTime.now())
                .countAfterTap(room.getCurrentCount())
                .build();

        buttonRecordRepository.save(buttonRecord);

        // Create user stats (this is a placeholder - you'll need to implement your own logic)
        List<UserStatsDto> userStats = createUserStats(room);

        return createCountResponse(room.getCurrentCount(), roomName, userStats, "Success");
    }

    @Override
    public CountResponseDto getCount(String roomName) {
        if (roomName == null || roomName.isEmpty()) {
            roomName = "Room 1"; // Default room
        }

        Optional<Room> roomOpt = roomRepository.findByName(roomName);
        if (roomOpt.isEmpty()) {
            return createCountResponse(0, roomName, new ArrayList<>(), "Room not found");
        }

        Room room = roomOpt.get();
        Integer count = room.getCurrentCount();
        List<UserStatsDto> userStats = createUserStats(room);

        return createCountResponse(count != null ? count : 0, roomName, userStats, "Success");
    }

    @Override
    public CountResponseDto getCount() {
        return getCount("Room 1"); // Default to Room 1 for backward compatibility
    }

    // Helper method to create CountResponseDto
    private CountResponseDto createCountResponse(int count, String roomName, List<UserStatsDto> userStats, String message) {
        return new CountResponseDto(count, roomName, userStats, message);
    }

    // Helper method to create user stats
    private List<UserStatsDto> createUserStats(Room room) {
        // This is a placeholder - implement your actual logic to get user stats
        List<UserStatsDto> userStats = new ArrayList<>();

        // You might want to query ButtonRecord to get stats for each user
        // For now, just create empty stats for each user
        for (String userId : room.getUserIds()) {
            userStats.add(new UserStatsDto(userId, 0)); // Assuming UserStatsDto has userId and tapCount
        }

        return userStats;
    }
}