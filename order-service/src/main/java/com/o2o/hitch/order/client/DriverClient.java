package com.o2o.hitch.order.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

import java.util.Map;

@FeignClient(name = "driver-service", fallback = DriverClientFallback.class)
public interface DriverClient {

    @GetMapping("/drivers/internal/{driverId}/availability")
    ApiResponse<Map<String, Object>> availability(@PathVariable("driverId") String driverId);

    @PutMapping("/drivers/internal/{driverId}/availability/{available}")
    ApiResponse<Map<String, Object>> updateAvailabilityInternal(@PathVariable("driverId") String driverId,
                                                                @PathVariable("available") boolean available);
}
