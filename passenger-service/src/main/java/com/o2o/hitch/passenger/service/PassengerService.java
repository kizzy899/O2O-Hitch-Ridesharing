package com.o2o.hitch.passenger.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PassengerService {

    private final Map<String, Map<String, Object>> passengerStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void initDefaults() {
        save("passenger001", "STANDARD", "13800009999");
    }

    public Map<String, Object> profile(String passengerId) {
        Map<String, Object> data = passengerStore.get(passengerId);
        if (data == null) {
            throw new BusinessException(4045, "PASSENGER_NOT_FOUND");
        }
        return data;
    }

    public Map<String, Object> registerOrUpdate(String passengerId, String level, String emergencyContact) {
        save(passengerId, level, emergencyContact);
        return profile(passengerId);
    }

    private void save(String passengerId, String level, String emergencyContact) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("passengerId", passengerId);
        data.put("level", level);
        data.put("emergencyContact", emergencyContact);
        passengerStore.put(passengerId, data);
    }
}
