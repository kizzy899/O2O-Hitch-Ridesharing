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
        AuthUserClient userClient = new AuthUserClient() {
            @Override
            public ApiResponse<Map<String, Object>> authProfile(String userId) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("role", "PASSENGER");
                profile.put("password", "123456");
                return ApiResponse.success(profile);
            }

            @Override
            public ApiResponse<Map<String, Object>> registerInternal(Map<String, Object> body) {
                return ApiResponse.success(new HashMap<>());
            }
        };

        AuthService authService = new AuthService(userClient);
        assertThrows(BusinessException.class, () -> authService.login("passenger001", "bad"));
    }

    @Test
    void loginShouldReturnRoleFromUserProfile() {
        AuthUserClient userClient = new AuthUserClient() {
            @Override
            public ApiResponse<Map<String, Object>> authProfile(String userId) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("role", "DRIVER");
                profile.put("password", "123456");
                return ApiResponse.success(profile);
            }

            @Override
            public ApiResponse<Map<String, Object>> registerInternal(Map<String, Object> body) {
                return ApiResponse.success(new HashMap<>());
            }
        };

        AuthService authService = new AuthService(userClient);
        Map<String, Object> result = authService.login("driver001", "123456");
        assertEquals("DRIVER", result.get("role"));
    }

    @Test
    void registerShouldReturnSessionWhenUserCreated() {
        AuthUserClient userClient = new AuthUserClient() {
            @Override
            public ApiResponse<Map<String, Object>> authProfile(String userId) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("userId", userId);
                profile.put("role", "PASSENGER");
                profile.put("password", "123456");
                return ApiResponse.success(profile);
            }

            @Override
            public ApiResponse<Map<String, Object>> registerInternal(Map<String, Object> body) {
                Map<String, Object> profile = new HashMap<>();
                profile.put("userId", body.get("userId"));
                profile.put("role", body.get("role"));
                profile.put("nickname", body.get("nickname"));
                profile.put("mobile", body.get("mobile"));
                return ApiResponse.success(profile);
            }
        };

        AuthService authService = new AuthService(userClient);
        Map<String, Object> result = authService.register("newuser001", "123456", "PASSENGER", "new-001", "13800001000");
        assertEquals("PASSENGER", result.get("role"));
        assertEquals("newuser001", result.get("userId"));
    }

    @Test
    void registerShouldFailWhenRoleIsNotAllowed() {
        AuthUserClient userClient = new AuthUserClient() {
            @Override
            public ApiResponse<Map<String, Object>> authProfile(String userId) {
                return ApiResponse.success(new HashMap<>());
            }

            @Override
            public ApiResponse<Map<String, Object>> registerInternal(Map<String, Object> body) {
                return ApiResponse.success(new HashMap<>());
            }
        };
        AuthService authService = new AuthService(userClient);
        assertThrows(BusinessException.class, () -> authService.register("admin002", "123456", "ADMIN", "a-2", "13800001001"));
    }
}
