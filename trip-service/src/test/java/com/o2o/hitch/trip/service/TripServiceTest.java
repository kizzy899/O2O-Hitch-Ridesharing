package com.o2o.hitch.trip.service;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.trip.client.PassengerClient;
import com.o2o.hitch.trip.client.UserClient;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TripServiceTest {

    @Test
    void createShouldUsePublishedStatusAndIncludeCreateTime() {
        UserClient userClient = new UserClient() {
            @Override
            public ApiResponse<Map<String, Object>> getUser(String userId, String role) {
                Map<String, Object> data = new HashMap<>();
                data.put("nickname", "passenger-A");
                return ApiResponse.success(data);
            }
        };

        TripService tripService = new TripService(userClient, passengerClientFound());
        Map<String, Object> trip = tripService.create("u1001", "A", "B");

        assertEquals("PUBLISHED", trip.get("status"));
        assertNotNull(trip.get("createdAt"));
    }

    @Test
    void markOrderAcceptedShouldUpdateStatus() {
        UserClient userClient = new UserClient() {
            @Override
            public ApiResponse<Map<String, Object>> getUser(String userId, String role) {
                Map<String, Object> data = new HashMap<>();
                data.put("nickname", "passenger-A");
                return ApiResponse.success(data);
            }
        };

        TripService tripService = new TripService(userClient, passengerClientFound());
        Map<String, Object> trip = tripService.create("u2002", "X", "Y");
        String tripId = String.valueOf(trip.get("tripId"));

        Map<String, Object> updated = tripService.markOrderAccepted(tripId);
        assertEquals("ORDER_ACCEPTED", updated.get("status"));
    }

    @Test
    void listShouldSupportPassengerAndStatusFilter() {
        UserClient userClient = new UserClient() {
            @Override
            public ApiResponse<Map<String, Object>> getUser(String userId, String role) {
                Map<String, Object> data = new HashMap<>();
                data.put("nickname", "passenger-A");
                return ApiResponse.success(data);
            }
        };

        TripService tripService = new TripService(userClient, passengerClientFound());
        Map<String, Object> trip1 = tripService.create("u3003", "A", "B");
        Map<String, Object> trip2 = tripService.create("u3003", "C", "D");
        tripService.markOrderAccepted(String.valueOf(trip2.get("tripId")));

        List<Map<String, Object>> accepted = tripService.list("u3003", "ORDER_ACCEPTED");
        assertEquals(1, accepted.size());
        assertEquals("ORDER_ACCEPTED", accepted.get(0).get("status"));
        assertEquals(String.valueOf(trip2.get("tripId")), String.valueOf(accepted.get(0).get("tripId")));

        List<Map<String, Object>> all = tripService.list("u3003", null);
        assertEquals(2, all.size());
        assertEquals(String.valueOf(trip1.get("passengerId")), String.valueOf(all.get(0).get("passengerId")));
    }

    @Test
    void createShouldFailWhenPassengerProfileMissing() {
        UserClient userClient = new UserClient() {
            @Override
            public ApiResponse<Map<String, Object>> getUser(String userId, String role) {
                Map<String, Object> data = new HashMap<>();
                data.put("nickname", "passenger-A");
                return ApiResponse.success(data);
            }
        };

        PassengerClient passengerClient = new PassengerClient() {
            @Override
            public ApiResponse<Map<String, Object>> profile(String passengerId) {
                return ApiResponse.success(null);
            }
        };

        TripService tripService = new TripService(userClient, passengerClient);
        assertThrows(BusinessException.class, () -> tripService.create("u404", "A", "B"));
    }

    private PassengerClient passengerClientFound() {
        return passengerId -> {
            Map<String, Object> data = new HashMap<>();
            data.put("passengerId", passengerId);
            data.put("level", "STANDARD");
            return ApiResponse.success(data);
        };
    }
}
