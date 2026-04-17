package com.o2o.hitch.passenger.controller;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.passenger.dto.PassengerRequest;
import com.o2o.hitch.passenger.service.PassengerService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/passengers")
@Validated
public class PassengerController {

    private final PassengerService passengerService;

    public PassengerController(PassengerService passengerService) {
        this.passengerService = passengerService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> registerOrUpdate(@Validated @RequestBody PassengerRequest body,
                                                              @RequestHeader("X-User-Role") String role) {
        if (!"PASSENGER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4037, "ROLE_NOT_ALLOWED_FOR_PASSENGER_UPDATE");
        }
        return ApiResponse.success(passengerService.registerOrUpdate(body.getPassengerId(), body.getLevel(), body.getEmergencyContact()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> profile(@PathVariable String id, @RequestHeader("X-User-Role") String role) {
        return ApiResponse.success(passengerService.profile(id));
    }

    @GetMapping("/internal/{id}")
    public ApiResponse<Map<String, Object>> internalProfile(@PathVariable String id) {
        return ApiResponse.success(passengerService.profile(id));
    }
}
