package com.o2o.hitch.trip.controller;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.trip.dto.TripRequest;
import com.o2o.hitch.trip.service.TripService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/trips")
@Validated
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createTrip(@Validated @RequestBody TripRequest body,
                                                        @RequestHeader("X-User-Role") String role,
                                                        @RequestHeader("X-User-Id") String userId) {
        if (!"PASSENGER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4031, "ROLE_NOT_ALLOWED_FOR_TRIP_CREATE");
        }
        if ("PASSENGER".equals(role) && !userId.equals(body.getPassengerId())) {
            throw new BusinessException(4035, "PASSENGER_SCOPE_MISMATCH");
        }
        return ApiResponse.success(tripService.create(body.getPassengerId(), body.getFrom(), body.getTo()));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getTrip(@PathVariable String id,
                                                     @RequestHeader("X-User-Role") String role,
                                                     @RequestHeader("X-User-Id") String userId) {
        Map<String, Object> trip = tripService.getById(id);
        if (!"ADMIN".equals(role)) {
            if (!"PASSENGER".equals(role)) {
                throw new BusinessException(4036, "ROLE_NOT_ALLOWED_FOR_TRIP_QUERY");
            }
            if (!userId.equals(String.valueOf(trip.get("passengerId")))) {
                throw new BusinessException(4035, "TRIP_READ_SCOPE_MISMATCH");
            }
        }
        return ApiResponse.success(trip);
    }

    @GetMapping("/internal/{id}")
    public ApiResponse<Map<String, Object>> getTripInternal(@PathVariable String id) {
        return ApiResponse.success(tripService.getById(id));
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> listTrips(@RequestParam("passengerId") String passengerId,
                                                            @RequestParam(value = "status", required = false) String status,
                                                            @RequestHeader("X-User-Role") String role,
                                                            @RequestHeader("X-User-Id") String userId) {
        if (!"PASSENGER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4036, "ROLE_NOT_ALLOWED_FOR_TRIP_QUERY");
        }
        if (!"ADMIN".equals(role) && !userId.equals(passengerId)) {
            throw new BusinessException(4035, "TRIP_QUERY_SCOPE_MISMATCH");
        }
        return ApiResponse.success(tripService.list(passengerId, status));
    }

    @PostMapping("/{id}/match-driver")
    public ApiResponse<Map<String, Object>> matchDriver(@PathVariable String id,
                                                         @RequestParam("driverId") String driverId,
                                                         @RequestHeader("X-User-Role") String role,
                                                         @RequestHeader("X-User-Id") String userId) {
        if (!"DRIVER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4034, "ROLE_NOT_ALLOWED_FOR_TRIP_MATCH");
        }
        if ("DRIVER".equals(role) && !userId.equals(driverId)) {
            throw new BusinessException(4035, "TRIP_MATCH_SCOPE_MISMATCH");
        }
        return ApiResponse.success(tripService.matchDriver(id, driverId));
    }

    @PostMapping("/internal/{id}/order-accepted")
    public ApiResponse<Map<String, Object>> markOrderAccepted(@PathVariable String id) {
        return ApiResponse.success(tripService.markOrderAccepted(id));
    }

    @PostMapping("/internal/{id}/order-completed")
    public ApiResponse<Map<String, Object>> markOrderCompleted(@PathVariable String id) {
        return ApiResponse.success(tripService.markOrderCompleted(id));
    }

    @PostMapping("/internal/{id}/order-cancelled")
    public ApiResponse<Map<String, Object>> markOrderCancelled(@PathVariable String id) {
        return ApiResponse.success(tripService.markOrderCancelled(id));
    }
}
