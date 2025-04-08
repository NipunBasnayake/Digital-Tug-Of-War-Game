package edu.nipun.kambaadima.controller;

import edu.nipun.kambaadima.dto.ButtonTapDto;
import edu.nipun.kambaadima.dto.CountResponseDto;
import edu.nipun.kambaadima.service.ButtonCounterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/button")
@CrossOrigin
@RequiredArgsConstructor
public class ButtonController {

    private final ButtonCounterService buttonCounterService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/tap")
    public ResponseEntity<CountResponseDto> handleButtonTap(@RequestBody ButtonTapDto tap) {
        CountResponseDto response = buttonCounterService.incrementAndGetCount(tap);

        // Send the update to the specific room
        String roomTopic = "/topic/count/" + (tap.getRoomName() != null ? tap.getRoomName() : "Room 1");
        messagingTemplate.convertAndSend(roomTopic, response);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<CountResponseDto> getCurrentCount() {
        return ResponseEntity.ok(buttonCounterService.getCount());
    }

    @GetMapping("/count/{roomName}")
    public ResponseEntity<CountResponseDto> getCurrentCount(@PathVariable String roomName) {
        return ResponseEntity.ok(buttonCounterService.getCount());
    }
}