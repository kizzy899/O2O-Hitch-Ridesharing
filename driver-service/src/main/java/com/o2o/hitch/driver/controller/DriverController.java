package com.o2o.hitch.driver.controller;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.driver.dto.DriverRequest;
import com.o2o.hitch.driver.service.DriverService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/drivers")
@Validated
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @GetMapping("/{driverId}/availability")
    public ApiResponse<Map<String, Object>> availability(@PathVariable String driverId, @RequestHeader("X-User-Role") String role) {
        return ApiResponse.success(driverService.availability(driverId));
    }

    @PutMapping("/{driverId}/availability")
    public ApiResponse<Map<String, Object>> updateAvailability(@PathVariable String driverId,
                                                                @Validated @RequestBody DriverRequest body,
                                                                @RequestHeader("X-User-Role") String role) {
        if (!"DRIVER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException(4036, "ROLE_NOT_ALLOWED_FOR_DRIVER_UPDATE");
        }
        return ApiResponse.success(driverService.updateAvailability(driverId, body.getAvailable()));
    }

    @GetMapping("/internal/{driverId}/availability")
    public ApiResponse<Map<String, Object>> internalAvailability(@PathVariable String driverId) {
        return ApiResponse.success(driverService.availability(driverId));
    }

    @PutMapping("/internal/{driverId}/availability/{available}")
    public ApiResponse<Map<String, Object>> internalUpdateAvailability(@PathVariable String driverId,
                                                                        @PathVariable boolean available) {
        return ApiResponse.success(driverService.updateAvailability(driverId, available));
    }
}
