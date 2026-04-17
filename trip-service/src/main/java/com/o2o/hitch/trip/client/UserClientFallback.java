package com.o2o.hitch.trip.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class UserClientFallback implements UserClient {
    @Override
    public ApiResponse<Map<String, Object>> getUser(String userId, String role) {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", userId);
        map.put("nickname", "fallback-user");
        return ApiResponse.success(map);
    }
}
