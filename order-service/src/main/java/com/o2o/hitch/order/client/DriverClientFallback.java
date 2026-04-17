package com.o2o.hitch.order.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class DriverClientFallback implements DriverClient {
    @Override
    public ApiResponse<Map<String, Object>> availability(String driverId) {
        Map<String, Object> map = new HashMap<>();
        map.put("driverId", driverId);
        map.put("available", false);
        map.put("fallback", true);
        return ApiResponse.success(map);
    }

    @Override
    public ApiResponse<Map<String, Object>> updateAvailabilityInternal(String driverId, boolean available) {
        Map<String, Object> map = new HashMap<>();
        map.put("driverId", driverId);
        map.put("available", available);
        map.put("fallback", true);
        return ApiResponse.success(map);
    }
}
