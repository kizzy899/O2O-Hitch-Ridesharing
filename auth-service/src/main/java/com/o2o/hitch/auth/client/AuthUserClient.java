package com.o2o.hitch.auth.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "user-service", fallback = AuthUserClientFallback.class)
public interface AuthUserClient {

    @GetMapping("/users/internal/{userId}/auth-profile")
    ApiResponse<Map<String, Object>> authProfile(@PathVariable("userId") String userId);
}
