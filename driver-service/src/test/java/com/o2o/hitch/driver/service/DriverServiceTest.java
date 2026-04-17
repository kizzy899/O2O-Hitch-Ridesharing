package com.o2o.hitch.driver.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DriverServiceTest {

    @Test
    void updateAvailabilityShouldChangeAvailability() {
        DriverService driverService = new DriverService();
        driverService.updateAvailability("driver001", false);
        Map<String, Object> result = driverService.availability("driver001");
        assertEquals(false, result.get("available"));
    }
}
