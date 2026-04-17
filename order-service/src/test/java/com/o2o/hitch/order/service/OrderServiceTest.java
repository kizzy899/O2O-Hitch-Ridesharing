package com.o2o.hitch.order.service;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.order.client.DriverClient;
import com.o2o.hitch.order.client.TripClient;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OrderServiceTest {

    private DriverClient stubDriverClient() {
        return new DriverClient() {
            @Override
            public ApiResponse<Map<String, Object>> availability(String driverId) {
                Map<String, Object> data = new HashMap<>();
                data.put("available", true);
                data.put("servedBy", "driver-service:9012");
                return ApiResponse.success(data);
            }

            @Override
            public ApiResponse<Map<String, Object>> updateAvailabilityInternal(String driverId, boolean available) {
                Map<String, Object> data = new HashMap<>();
                data.put("available", available);
                data.put("servedBy", "driver-service:9012");
                return ApiResponse.success(data);
            }
        };
    }

    private TripClient stubTripClient(String passengerId) {
        return new TripClient() {
            @Override
            public ApiResponse<Map<String, Object>> getTrip(String tripId) {
                Map<String, Object> trip = new HashMap<>();
                trip.put("tripId", tripId);
                trip.put("passengerId", passengerId);
                trip.put("status", "PUBLISHED");
                return ApiResponse.success(trip);
            }

            @Override
            public ApiResponse<Map<String, Object>> markOrderAccepted(String tripId) {
                Map<String, Object> trip = new HashMap<>();
                trip.put("tripId", tripId);
                trip.put("status", "ORDER_ACCEPTED");
                return ApiResponse.success(trip);
            }

            @Override
            public ApiResponse<Map<String, Object>> markOrderCompleted(String tripId) {
                Map<String, Object> trip = new HashMap<>();
                trip.put("tripId", tripId);
                trip.put("status", "ORDER_COMPLETED");
                return ApiResponse.success(trip);
            }

            @Override
            public ApiResponse<Map<String, Object>> markOrderCancelled(String tripId) {
                Map<String, Object> trip = new HashMap<>();
                trip.put("tripId", tripId);
                trip.put("status", "ORDER_CANCELLED");
                return ApiResponse.success(trip);
            }
        };
    }

    @Test
    void createShouldReturnPendingAcceptStatus() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p001"), new RestTemplate());
        Map<String, Object> order = orderService.create("TRIP-100", "driver001", "p001");
        assertEquals("PENDING_ACCEPT", order.get("status"));
    }

    @Test
    void createShouldFailWhenTripPassengerMismatch() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p999"), new RestTemplate());
        assertThrows(BusinessException.class, () -> orderService.create("TRIP-100", "driver001", "p001"));
    }

    @Test
    void acceptShouldUpdateTripStatusAndDriverAvailability() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p001"), new RestTemplate());
        Map<String, Object> created = orderService.create("TRIP-200", "driver001", "p001");
        Map<String, Object> accepted = orderService.accept(String.valueOf(created.get("orderId")));

        assertEquals("ACCEPTED", accepted.get("status"));
        assertEquals("ORDER_ACCEPTED", accepted.get("tripStatus"));
        assertEquals(false, accepted.get("driverAvailable"));
    }

    @Test
    void completeShouldRecoverDriverAvailability() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p001"), new RestTemplate());
        Map<String, Object> created = orderService.create("TRIP-300", "driver001", "p001");
        orderService.accept(String.valueOf(created.get("orderId")));
        Map<String, Object> completed = orderService.complete(String.valueOf(created.get("orderId")));

        assertEquals("COMPLETED", completed.get("status"));
        assertEquals("ORDER_COMPLETED", completed.get("tripStatus"));
        assertEquals(true, completed.get("driverAvailable"));
    }

    @Test
    void cancelShouldWorkAfterAcceptAndRecoverDriverAvailability() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p001"), new RestTemplate());
        Map<String, Object> created = orderService.create("TRIP-400", "driver001", "p001");
        orderService.accept(String.valueOf(created.get("orderId")));
        Map<String, Object> cancelled = orderService.cancel(String.valueOf(created.get("orderId")));

        assertEquals("CANCELLED", cancelled.get("status"));
        assertEquals("ORDER_CANCELLED", cancelled.get("tripStatus"));
        assertEquals(true, cancelled.get("driverAvailable"));
    }

    @Test
    void listShouldSupportRoleAndStatusFilter() {
        OrderService orderService = new OrderService(stubDriverClient(), stubTripClient("p001"), new RestTemplate());
        Map<String, Object> pending = orderService.create("TRIP-501", "driver001", "p001");
        Map<String, Object> accepted = orderService.create("TRIP-502", "driver001", "p001");
        orderService.accept(String.valueOf(accepted.get("orderId")));

        List<Map<String, Object>> acceptedByDriver = orderService.list("driver001", "DRIVER", "ACCEPTED");
        assertEquals(1, acceptedByDriver.size());
        assertEquals("ACCEPTED", acceptedByDriver.get(0).get("status"));

        List<Map<String, Object>> allByPassenger = orderService.list("p001", "PASSENGER", null);
        assertEquals(2, allByPassenger.size());
        assertEquals(String.valueOf(pending.get("passengerId")), String.valueOf(allByPassenger.get(0).get("passengerId")));
    }
}
