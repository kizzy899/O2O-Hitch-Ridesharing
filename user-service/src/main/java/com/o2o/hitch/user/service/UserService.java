package com.o2o.hitch.user.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserService {

    private final Map<String, Map<String, Object>> userStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void initDefaults() {
        saveUser("passenger001", "PASSENGER", "passenger-001", "13800000001", "123456");
        saveUser("driver001", "DRIVER", "driver-001", "13800000002", "123456");
        saveUser("admin001", "ADMIN", "admin-001", "13800000003", "123456");
    }

    public Map<String, Object> profile(String userId) {
        Map<String, Object> source = userStore.get(userId);
        if (source == null) {
            throw new BusinessException(4043, "USER_NOT_FOUND");
        }
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId", source.get("userId"));
        profile.put("role", source.get("role"));
        profile.put("nickname", source.get("nickname"));
        profile.put("mobile", source.get("mobile"));
        return profile;
    }

    public Map<String, Object> authProfile(String userId) {
        Map<String, Object> source = userStore.get(userId);
        if (source == null) {
            throw new BusinessException(4043, "USER_NOT_FOUND");
        }
        Map<String, Object> authProfile = new LinkedHashMap<>();
        authProfile.put("userId", source.get("userId"));
        authProfile.put("role", source.get("role"));
        authProfile.put("password", source.get("password"));
        return authProfile;
    }

    public Map<String, Object> registerOrUpdate(String userId, String role, String nickname, String mobile, String password) {
        return profile(saveUser(userId, role, nickname, mobile, password).get("userId").toString());
    }

    private Map<String, Object> saveUser(String userId, String role, String nickname, String mobile, String password) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId", userId);
        profile.put("role", role);
        profile.put("nickname", nickname);
        profile.put("mobile", mobile);
        profile.put("password", password);
        userStore.put(userId, profile);
        return profile;
    }
}
