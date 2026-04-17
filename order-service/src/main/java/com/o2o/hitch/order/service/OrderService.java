package com.o2o.hitch.order.service;

import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.order.client.DriverClient;
import com.o2o.hitch.order.client.TripClient;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OrderService {

    private static final String STATUS_PENDING_ACCEPT = "PENDING_ACCEPT";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private final DriverClient driverClient;
    private final TripClient tripClient;
    private final RestTemplate restTemplate;
    private final Map<String, Map<String, Object>> orderStore = new ConcurrentHashMap<>();
    private final Map<String, String> tripOrderIndex = new ConcurrentHashMap<>();

    public OrderService(DriverClient driverClient, TripClient tripClient, RestTemplate restTemplate) {
        this.driverClient = driverClient;
        this.tripClient = tripClient;
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> create(String tripId, String driverId, String passengerId) {
        String existingOrderId = tripOrderIndex.get(tripId);
        if (existingOrderId != null) {
            return orderStore.get(existingOrderId);
        }

        Map<String, Object> trip = tripClient.getTrip(tripId).getData();
        validateTrip(tripId, passengerId, trip);

        Map<String, Object> availability = driverClient.availability(driverId).getData();
        if (availability == null || !Boolean.TRUE.equals(availability.get("available"))) {
            throw new BusinessException(4002, "DRIVER_NOT_AVAILABLE");
        }

        Map<String, Object> order = new LinkedHashMap<>();
        String orderId = "ORDER-" + UUID.randomUUID().toString().substring(0, 8);
        long now = Instant.now().toEpochMilli();
        order.put("orderId", orderId);
        order.put("tripId", tripId);
        order.put("driverId", driverId);
        order.put("passengerId", passengerId);
        order.put("status", STATUS_PENDING_ACCEPT);
        order.put("driverNode", availability.get("servedBy"));
        order.put("driverAvailable", availability.get("available"));
        order.put("tripStatus", trip.get("status"));
        order.put("createdAt", now);
        order.put("updatedAt", now);

        orderStore.put(orderId, order);
        tripOrderIndex.put(tripId, orderId);
        return order;
    }

    public Map<String, Object> accept(String orderId) {
        Map<String, Object> order = getById(orderId);
        if (!STATUS_PENDING_ACCEPT.equals(order.get("status"))) {
            throw new BusinessException(4091, "ORDER_STATUS_CONFLICT");
        }

        String tripId = String.valueOf(order.get("tripId"));
        String driverId = String.valueOf(order.get("driverId"));

        Map<String, Object> trip = tripClient.markOrderAccepted(tripId).getData();
        if (trip == null || trip.get("status") == null) {
            throw new BusinessException(5003, "TRIP_STATUS_UPDATE_FAILED");
        }

        Map<String, Object> driver = driverClient.updateAvailabilityInternal(driverId, false).getData();
        if (driver == null || driver.get("available") == null) {
            throw new BusinessException(5004, "DRIVER_STATUS_UPDATE_FAILED");
        }

        order.put("status", STATUS_ACCEPTED);
        order.put("tripStatus", trip.get("status"));
        order.put("driverAvailable", driver.get("available"));
        order.put("updatedAt", Instant.now().toEpochMilli());
        return order;
    }

    public Map<String, Object> complete(String orderId) {
        Map<String, Object> order = getById(orderId);
        if (!STATUS_ACCEPTED.equals(order.get("status"))) {
            throw new BusinessException(4091, "ORDER_STATUS_CONFLICT");
        }

        String tripId = String.valueOf(order.get("tripId"));
        String driverId = String.valueOf(order.get("driverId"));

        Map<String, Object> trip = tripClient.markOrderCompleted(tripId).getData();
        if (trip == null || trip.get("status") == null) {
            throw new BusinessException(5003, "TRIP_STATUS_UPDATE_FAILED");
        }

        Map<String, Object> driver = driverClient.updateAvailabilityInternal(driverId, true).getData();
        if (driver == null || driver.get("available") == null) {
            throw new BusinessException(5004, "DRIVER_STATUS_UPDATE_FAILED");
        }

        order.put("status", STATUS_COMPLETED);
        order.put("tripStatus", trip.get("status"));
        order.put("driverAvailable", driver.get("available"));
        order.put("updatedAt", Instant.now().toEpochMilli());
        return order;
    }

    public Map<String, Object> cancel(String orderId) {
        Map<String, Object> order = getById(orderId);
        String status = String.valueOf(order.get("status"));
        if (!(STATUS_PENDING_ACCEPT.equals(status) || STATUS_ACCEPTED.equals(status))) {
            throw new BusinessException(4091, "ORDER_STATUS_CONFLICT");
        }

        String tripId = String.valueOf(order.get("tripId"));
        String driverId = String.valueOf(order.get("driverId"));

        Map<String, Object> trip = tripClient.markOrderCancelled(tripId).getData();
        if (trip == null || trip.get("status") == null) {
            throw new BusinessException(5003, "TRIP_STATUS_UPDATE_FAILED");
        }

        boolean driverAvailable = true;
        if (STATUS_ACCEPTED.equals(status)) {
            Map<String, Object> driver = driverClient.updateAvailabilityInternal(driverId, true).getData();
            if (driver == null || driver.get("available") == null) {
                throw new BusinessException(5004, "DRIVER_STATUS_UPDATE_FAILED");
            }
            driverAvailable = Boolean.TRUE.equals(driver.get("available"));
        }

        order.put("status", STATUS_CANCELLED);
        order.put("tripStatus", trip.get("status"));
        order.put("driverAvailable", driverAvailable);
        order.put("updatedAt", Instant.now().toEpochMilli());
        return order;
    }

    public Map<String, Object> getById(String orderId) {
        Map<String, Object> order = orderStore.get(orderId);
        if (order == null) {
            throw new BusinessException(4042, "ORDER_NOT_FOUND");
        }
        return order;
    }

    public List<Map<String, Object>> list(String userId, String role, String status) {
        if (userId == null || userId.trim().isEmpty()) {
            throw new BusinessException(4006, "USER_ID_REQUIRED");
        }
        if (!("PASSENGER".equals(role) || "DRIVER".equals(role) || "ADMIN".equals(role))) {
            throw new BusinessException(4037, "ROLE_NOT_ALLOWED_FOR_ORDER_QUERY");
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> order : orderStore.values()) {
            if (!matchRoleScope(order, userId, role)) {
                continue;
            }
            if (status != null && !status.trim().isEmpty() && !status.equals(String.valueOf(order.get("status")))) {
                continue;
            }
            result.add(order);
        }
        result.sort((a, b) -> Long.compare(
                Long.parseLong(String.valueOf(b.get("updatedAt"))),
                Long.parseLong(String.valueOf(a.get("updatedAt")))
        ));
        return result;
    }

    public List<Object> ribbonDemo(String driverId, int times) {
        int loop = Math.max(1, Math.min(times, 20));
        List<Object> hits = new ArrayList<>();
        for (int i = 0; i < loop; i++) {
            Map<?, ?> response = restTemplate.getForObject("http://driver-service/drivers/internal/" + driverId + "/availability", Map.class);
            hits.add(response);
        }
        return hits;
    }

    private void validateTrip(String tripId, String passengerId, Map<String, Object> trip) {
        if (trip == null || trip.get("tripId") == null) {
            throw new BusinessException(4041, "TRIP_NOT_FOUND");
        }
        if (!tripId.equals(String.valueOf(trip.get("tripId")))) {
            throw new BusinessException(4041, "TRIP_NOT_FOUND");
        }
        Object tripPassenger = trip.get("passengerId");
        if (tripPassenger == null || !passengerId.equals(String.valueOf(tripPassenger))) {
            throw new BusinessException(4005, "TRIP_PASSENGER_MISMATCH");
        }
        String tripStatus = String.valueOf(trip.get("status"));
        if (!("PUBLISHED".equals(tripStatus) || "MATCHED".equals(tripStatus))) {
            throw new BusinessException(4092, "TRIP_STATUS_NOT_ALLOWED");
        }
    }

    private boolean matchRoleScope(Map<String, Object> order, String userId, String role) {
        if ("ADMIN".equals(role)) {
            return true;
        }
        if ("PASSENGER".equals(role)) {
            return userId.equals(String.valueOf(order.get("passengerId")));
        }
        return userId.equals(String.valueOf(order.get("driverId")));
    }
}
