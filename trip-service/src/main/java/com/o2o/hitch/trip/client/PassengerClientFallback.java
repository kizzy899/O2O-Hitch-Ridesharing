package com.o2o.hitch.trip.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PassengerClientFallback implements PassengerClient {
    @Override
    public ApiResponse<Map<String, Object>> profile(String passengerId) {
        return ApiResponse.success(null);
    }
}
