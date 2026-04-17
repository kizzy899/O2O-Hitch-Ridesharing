package com.o2o.hitch.trip.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "passenger-service", fallback = PassengerClientFallback.class)
public interface PassengerClient {

    @GetMapping("/passengers/internal/{passengerId}")
    ApiResponse<Map<String, Object>> profile(@PathVariable("passengerId") String passengerId);
}
