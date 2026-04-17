package com.o2o.hitch.order.controller;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.order.dto.OrderRequest;
import com.o2o.hitch.order.service.OrderService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@Validated
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/create")
    public ApiResponse<Map<String, Object>> create(@Validated @RequestBody OrderRequest body,
                                                    @RequestHeader("X-User-Role") String role,
                                                    @RequestHeader("X-User-Id") String userId) {
        if (!"PASSENGER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4032, "ROLE_NOT_ALLOWED_FOR_ORDER_CREATE");
        }
        if ("PASSENGER".equals(role) && !userId.equals(body.getPassengerId())) {
            throw new BusinessException(4035, "PASSENGER_SCOPE_MISMATCH");
        }
        return ApiResponse.success(orderService.create(body.getTripId(), body.getDriverId(), body.getPassengerId()));
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Map<String, Object>> accept(@PathVariable String id,
                                                    @RequestHeader("X-User-Role") String role,
                                                    @RequestHeader("X-User-Id") String userId) {
        if (!"DRIVER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4033, "ROLE_NOT_ALLOWED_FOR_ORDER_ACCEPT");
        }
        assertOrderScope(id, role, userId, "ORDER_ACCEPT_SCOPE_MISMATCH");
        return ApiResponse.success(orderService.accept(id));
    }

    @PostMapping("/{id}/complete")
    public ApiResponse<Map<String, Object>> complete(@PathVariable String id,
                                                      @RequestHeader("X-User-Role") String role,
                                                      @RequestHeader("X-User-Id") String userId) {
        if (!"DRIVER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4038, "ROLE_NOT_ALLOWED_FOR_ORDER_COMPLETE");
        }
        assertOrderScope(id, role, userId, "ORDER_COMPLETE_SCOPE_MISMATCH");
        return ApiResponse.success(orderService.complete(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Map<String, Object>> cancel(@PathVariable String id,
                                                    @RequestHeader("X-User-Role") String role,
                                                    @RequestHeader("X-User-Id") String userId) {
        if (!"PASSENGER".equals(role) && !"DRIVER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4039, "ROLE_NOT_ALLOWED_FOR_ORDER_CANCEL");
        }
        assertOrderScope(id, role, userId, "ORDER_CANCEL_SCOPE_MISMATCH");
        return ApiResponse.success(orderService.cancel(id));
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getById(@PathVariable String id,
                                                     @RequestHeader("X-User-Role") String role,
                                                     @RequestHeader("X-User-Id") String userId) {
        assertOrderScope(id, role, userId, "ORDER_READ_SCOPE_MISMATCH");
        return ApiResponse.success(orderService.getById(id));
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam("userId") String userId,
                                                       @RequestParam(value = "status", required = false) String status,
                                                       @RequestHeader("X-User-Role") String role,
                                                       @RequestHeader("X-User-Id") String actorId) {
        if (!"ADMIN".equals(role) && !actorId.equals(userId)) {
            throw new BusinessException(4035, "ORDER_QUERY_SCOPE_MISMATCH");
        }
        return ApiResponse.success(orderService.list(userId, role, status));
    }

    @GetMapping("/lb-check")
    public ApiResponse<Object> lbCheck(@RequestParam(defaultValue = "8") int times, @RequestParam(defaultValue = "driver001") String driverId) {
        return ApiResponse.success(orderService.ribbonDemo(driverId, times));
    }

    private void assertOrderScope(String orderId, String role, String userId, String errorMessage) {
        if ("ADMIN".equals(role)) {
            return;
        }
        Map<String, Object> order = orderService.getById(orderId);
        if ("PASSENGER".equals(role) && userId.equals(String.valueOf(order.get("passengerId")))) {
            return;
        }
        if ("DRIVER".equals(role) && userId.equals(String.valueOf(order.get("driverId")))) {
            return;
        }
        throw new BusinessException(4035, errorMessage);
    }
}
