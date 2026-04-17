package com.o2o.hitch.trip.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;

@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {

    @GetMapping("/users/{userId}")
    ApiResponse<Map<String, Object>> getUser(@PathVariable("userId") String userId, @RequestHeader("X-User-Role") String role);
}
