package com.o2o.hitch.order.controller;

import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.order.dto.OrderRequest;
import com.o2o.hitch.order.service.OrderService;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderControllerTest {

    @Test
    void createShouldRejectPassengerOperatingAnotherPassengerOrder() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        OrderRequest request = new OrderRequest();
        request.setTripId("TRIP-901");
        request.setDriverId("driver001");
        request.setPassengerId("passenger002");

        assertThrows(BusinessException.class, () ->
                controller.create(request, "PASSENGER", "passenger001"));
    }

    @Test
    void listShouldRejectPassengerQueryingAnotherPassengerData() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);

        assertThrows(BusinessException.class, () ->
                controller.list("passenger002", null, "PASSENGER", "passenger001"));
    }

    @Test
    void listShouldAllowAdminQueryingAnyUserData() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);

        assertDoesNotThrow(() ->
                controller.list("passenger002", null, "ADMIN", "admin001"));
    }

    @Test
    void acceptShouldRejectDriverOperatingAnotherDriversOrder() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        Map<String, Object> order = new HashMap<>();
        order.put("driverId", "driver002");
        order.put("passengerId", "passenger001");
        when(orderService.getById("ORDER-1")).thenReturn(order);

        assertThrows(BusinessException.class, () ->
                controller.accept("ORDER-1", "DRIVER", "driver001"));
    }

    @Test
    void completeShouldAllowOrderOwnerDriver() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        Map<String, Object> order = new HashMap<>();
        order.put("driverId", "driver001");
        order.put("passengerId", "passenger001");
        when(orderService.getById("ORDER-2")).thenReturn(order);

        assertDoesNotThrow(() ->
                controller.complete("ORDER-2", "DRIVER", "driver001"));
    }

    @Test
    void cancelShouldRejectPassengerCancellingAnotherPassengersOrder() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        Map<String, Object> order = new HashMap<>();
        order.put("driverId", "driver001");
        order.put("passengerId", "passenger002");
        when(orderService.getById("ORDER-3")).thenReturn(order);

        assertThrows(BusinessException.class, () ->
                controller.cancel("ORDER-3", "PASSENGER", "passenger001"));
    }

    @Test
    void getByIdShouldRejectCrossScopeDriverRead() {
        OrderService orderService = mock(OrderService.class);
        OrderController controller = new OrderController(orderService);
        Map<String, Object> order = new HashMap<>();
        order.put("driverId", "driver002");
        order.put("passengerId", "passenger001");
        when(orderService.getById("ORDER-4")).thenReturn(order);

        assertThrows(BusinessException.class, () ->
                controller.getById("ORDER-4", "DRIVER", "driver001"));
    }
}
