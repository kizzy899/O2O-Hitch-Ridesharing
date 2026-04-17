package com.o2o.hitch.driver.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DriverService {

    @Value("${server.port}")
    private String port;

    private final Map<String, Boolean> availabilityStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void initDefaults() {
        availabilityStore.put("driver001", true);
        availabilityStore.put("driver002", true);
    }

    public Map<String, Object> availability(String driverId) {
        if (!availabilityStore.containsKey(driverId)) {
            throw new BusinessException(4044, "DRIVER_NOT_FOUND");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("driverId", driverId);
        data.put("available", availabilityStore.get(driverId));
        data.put("servedBy", "driver-service:" + port);
        return data;
    }

    public Map<String, Object> updateAvailability(String driverId, boolean available) {
        availabilityStore.put(driverId, available);
        return availability(driverId);
    }
}
