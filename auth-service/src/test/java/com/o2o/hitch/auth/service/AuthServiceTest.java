package com.o2o.hitch.auth.service;

import com.o2o.hitch.auth.client.AuthUserClient;
import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AuthServiceTest {

    @Test
    void loginShouldFailWhenPasswordMismatch() {
        AuthUserClient userClient = userId -> {
            Map<String, Object> profile = new HashMap<>();
            profile.put("role", "PASSENGER");
            profile.put("password", "123456");
            return ApiResponse.success(profile);
        };

        AuthService authService = new AuthService(userClient);
        assertThrows(BusinessException.class, () -> authService.login("passenger001", "bad"));
    }

    @Test
    void loginShouldReturnRoleFromUserProfile() {
        AuthUserClient userClient = userId -> {
            Map<String, Object> profile = new HashMap<>();
            profile.put("role", "DRIVER");
            profile.put("password", "123456");
            return ApiResponse.success(profile);
        };

        AuthService authService = new AuthService(userClient);
        Map<String, Object> result = authService.login("driver001", "123456");
        assertEquals("DRIVER", result.get("role"));
    }
}
