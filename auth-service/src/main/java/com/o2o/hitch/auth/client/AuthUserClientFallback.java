package com.o2o.hitch.auth.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class AuthUserClientFallback implements AuthUserClient {

    @Override
    public ApiResponse<Map<String, Object>> authProfile(String userId) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", userId);
        profile.put("role", "PASSENGER");
        profile.put("password", "");
        profile.put("fallback", true);
        return ApiResponse.success(profile);
    }
}
