package com.o2o.hitch.auth.service;

import com.o2o.hitch.auth.client.AuthUserClient;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.common.security.JwtTokenService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
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

        String role = String.valueOf(profile.get("role"));
        String token = jwtTokenService.issueToken(username, role, secret, expireSeconds);
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("userId", username);
        data.put("role", role);
        return data;
    }

    public Map<String, Object> me(String token) {
        Claims claims = jwtTokenService.parse(token, secret);
        Map<String, Object> data = new HashMap<>();
        data.put("userId", claims.get("userId"));
        data.put("role", claims.get("role"));
        return data;
    }
}

