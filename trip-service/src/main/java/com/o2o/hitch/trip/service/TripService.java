package com.o2o.hitch.trip.service;

import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.trip.client.PassengerClient;
import com.o2o.hitch.trip.client.UserClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TripService {

    private static final String STATUS_PUBLISHED = "PUBLISHED";
    private static final String STATUS_MATCHED = "MATCHED";
    private static final String STATUS_ORDER_ACCEPTED = "ORDER_ACCEPTED";
    private static final String STATUS_ORDER_COMPLETED = "ORDER_COMPLETED";
    private static final String STATUS_ORDER_CANCELLED = "ORDER_CANCELLED";

    private final UserClient userClient;
    private final PassengerClient passengerClient;
    private final Map<String, Map<String, Object>> tripStore = new ConcurrentHashMap<>();

    public TripService(UserClient userClient, PassengerClient passengerClient) {
        this.userClient = userClient;
        this.passengerClient = passengerClient;
    }

    public Map<String, Object> create(String passengerId, String from, String to) {
        if (passengerId == null || passengerId.trim().isEmpty()) {
            throw new BusinessException(4004, "PASSENGER_ID_REQUIRED");
        }
        Map<String, Object> passenger = passengerClient.profile(passengerId).getData();
        if (passenger == null || !passengerId.equals(String.valueOf(passenger.get("passengerId")))) {
            throw new BusinessException(5005, "PASSENGER_PROFILE_UNAVAILABLE");
        }
        Map<String, Object> user = userClient.getUser(passengerId, "PASSENGER").getData();
        if (user == null || user.get("nickname") == null) {
            throw new BusinessException(5002, "USER_PROFILE_UNAVAILABLE");
        }
        Map<String, Object> trip = new LinkedHashMap<>();
        String tripId = "TRIP-" + UUID.randomUUID().toString().substring(0, 8);
        long now = Instant.now().toEpochMilli();
        trip.put("tripId", tripId);
        trip.put("passengerId", passengerId);
        trip.put("passengerNickname", user.get("nickname"));
        trip.put("from", from);
        trip.put("to", to);
        trip.put("status", STATUS_PUBLISHED);
        trip.put("createdAt", now);
        trip.put("updatedAt", now);
        tripStore.put(tripId, trip);
        return trip;
    }

    public Map<String, Object> getById(String tripId) {
        Map<String, Object> trip = tripStore.get(tripId);
        if (trip == null) {
            throw new BusinessException(4041, "TRIP_NOT_FOUND");
        }
        return trip;
    }

    public Map<String, Object> matchDriver(String tripId, String driverId) {
        Map<String, Object> trip = getById(tripId);
        trip.put("driverId", driverId);
        trip.put("status", STATUS_MATCHED);
        trip.put("updatedAt", Instant.now().toEpochMilli());
        return trip;
    }

    public Map<String, Object> markOrderAccepted(String tripId) {
        return updateStatus(tripId, STATUS_ORDER_ACCEPTED);
    }

    public Map<String, Object> markOrderCompleted(String tripId) {
        return updateStatus(tripId, STATUS_ORDER_COMPLETED);
    }

    public Map<String, Object> markOrderCancelled(String tripId) {
        return updateStatus(tripId, STATUS_ORDER_CANCELLED);
    }

    public List<Map<String, Object>> list(String passengerId, String status) {
        if (passengerId == null || passengerId.trim().isEmpty()) {
            throw new BusinessException(4004, "PASSENGER_ID_REQUIRED");
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> trip : tripStore.values()) {
            if (!passengerId.equals(String.valueOf(trip.get("passengerId")))) {
                continue;
            }
            if (status != null && !status.trim().isEmpty() && !status.equals(String.valueOf(trip.get("status")))) {
                continue;
            }
            result.add(trip);
        }
        result.sort((a, b) -> Long.compare(
                Long.parseLong(String.valueOf(b.get("updatedAt"))),
                Long.parseLong(String.valueOf(a.get("updatedAt")))
        ));
        return result;
    }

    private Map<String, Object> updateStatus(String tripId, String status) {
        Map<String, Object> trip = getById(tripId);
        trip.put("status", status);
        trip.put("updatedAt", Instant.now().toEpochMilli());
        return trip;
    }
}
