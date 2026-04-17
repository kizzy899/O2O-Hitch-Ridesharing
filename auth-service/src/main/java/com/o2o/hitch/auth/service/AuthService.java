package com.o2o.hitch.auth.service;

import com.o2o.hitch.auth.client.AuthUserClient;
import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.common.security.JwtTokenService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class AuthService {

    private final JwtTokenService jwtTokenService = new JwtTokenService();
    private final AuthUserClient authUserClient;

    @Value("${security.jwt.secret:O2O_DEMO_SECRET}")
    private String secret = "O2O_DEMO_SECRET";

    @Value("${security.jwt.expire-seconds:7200}")
    private long expireSeconds = 7200L;

    public AuthService(AuthUserClient authUserClient) {
        this.authUserClient = authUserClient;
    }

    public Map<String, Object> login(String username, String password) {
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new BusinessException(4011, "USERNAME_OR_PASSWORD_INVALID");
        }

        Map<String, Object> profile = authUserClient.authProfile(username).getData();
        if (profile == null || profile.get("password") == null || profile.get("role") == null) {
            throw new BusinessException(4011, "USERNAME_OR_PASSWORD_INVALID");
        }

        String storedPassword = String.valueOf(profile.get("password"));
        if (!password.equals(storedPassword)) {
            throw new BusinessException(4011, "USERNAME_OR_PASSWORD_INVALID");
        }

        String role = normalizeRole(String.valueOf(profile.get("role")));
        return issueSession(username, role);
    }

    public Map<String, Object> me(String token) {
        Claims claims = jwtTokenService.parse(token, secret);
        Map<String, Object> data = new HashMap<>();
        data.put("userId", claims.get("userId"));
        data.put("role", claims.get("role"));
        return data;
    }

    public Map<String, Object> register(String username, String password, String role, String nickname, String mobile) {
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new BusinessException(4011, "USERNAME_OR_PASSWORD_INVALID");
        }
        if (nickname == null || nickname.trim().isEmpty() || mobile == null || mobile.trim().isEmpty()) {
            throw new BusinessException(4001, "REQUEST_VALIDATION_FAILED");
        }

        String normalizedRole = normalizeRole(role);
        if (!"PASSENGER".equals(normalizedRole) && !"DRIVER".equals(normalizedRole)) {
            throw new BusinessException(4036, "ROLE_NOT_ALLOWED_FOR_REGISTER");
        }

        Map<String, Object> registerBody = new HashMap<>();
        registerBody.put("userId", username.trim());
        registerBody.put("password", password);
        registerBody.put("role", normalizedRole);
        registerBody.put("nickname", nickname.trim());
        registerBody.put("mobile", mobile.trim());

        ApiResponse<Map<String, Object>> response = authUserClient.registerInternal(registerBody);
        if (response.getCode() != 0) {
            throw new BusinessException(response.getCode(), response.getMessage());
        }

        Map<String, Object> created = response.getData();
        if (created == null || created.get("userId") == null || created.get("role") == null) {
            throw new BusinessException(5001, "REGISTER_RESPONSE_INVALID");
        }

        return issueSession(String.valueOf(created.get("userId")), normalizeRole(String.valueOf(created.get("role"))));
    }

    private Map<String, Object> issueSession(String userId, String role) {
        String token = jwtTokenService.issueToken(userId, role, secret, expireSeconds);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", userId);
        data.put("role", role);
        return data;
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "";
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }
}

