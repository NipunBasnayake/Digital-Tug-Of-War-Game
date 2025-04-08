package edu.nipun.kambaadima.service;

import edu.nipun.kambaadima.dto.ButtonTapDto;
import edu.nipun.kambaadima.dto.CountResponseDto;

public interface ButtonCounterService {
    CountResponseDto incrementAndGetCount(ButtonTapDto tapDto);
    CountResponseDto getCount();
    CountResponseDto getCount(String roomName);
}