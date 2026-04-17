package com.o2o.hitch.order.client;

import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Map;

@FeignClient(name = "trip-service", fallback = TripClientFallback.class)
public interface TripClient {

    @GetMapping("/trips/internal/{tripId}")
    ApiResponse<Map<String, Object>> getTrip(@PathVariable("tripId") String tripId);

    @PostMapping("/trips/internal/{tripId}/order-accepted")
    ApiResponse<Map<String, Object>> markOrderAccepted(@PathVariable("tripId") String tripId);

    @PostMapping("/trips/internal/{tripId}/order-completed")
    ApiResponse<Map<String, Object>> markOrderCompleted(@PathVariable("tripId") String tripId);

    @PostMapping("/trips/internal/{tripId}/order-cancelled")
    ApiResponse<Map<String, Object>> markOrderCancelled(@PathVariable("tripId") String tripId);
}
