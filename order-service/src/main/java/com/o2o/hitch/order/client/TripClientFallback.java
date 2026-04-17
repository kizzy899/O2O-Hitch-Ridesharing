package com.o2o.hitch.order.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class TripClientFallback implements TripClient {

    @Override
    public ApiResponse<Map<String, Object>> getTrip(String tripId) {
        Map<String, Object> map = new HashMap<>();
        map.put("tripId", tripId);
        map.put("status", "UNKNOWN");
        map.put("fallback", true);
        return ApiResponse.success(map);
    }

    @Override
    public ApiResponse<Map<String, Object>> markOrderAccepted(String tripId) {
        Map<String, Object> map = new HashMap<>();
        map.put("tripId", tripId);
        map.put("status", "MATCHED");
        map.put("fallback", true);
        return ApiResponse.success(map);
    }

    @Override
    public ApiResponse<Map<String, Object>> markOrderCompleted(String tripId) {
        Map<String, Object> map = new HashMap<>();
        map.put("tripId", tripId);
        map.put("status", "ORDER_COMPLETED");
        map.put("fallback", true);
        return ApiResponse.success(map);
    }

    @Override
    public ApiResponse<Map<String, Object>> markOrderCancelled(String tripId) {
        Map<String, Object> map = new HashMap<>();
        map.put("tripId", tripId);
        map.put("status", "ORDER_CANCELLED");
        map.put("fallback", true);
        return ApiResponse.success(map);
    }
}
