package com.o2o.hitch.auth.controller;

import com.o2o.hitch.auth.dto.AuthRequest;
import com.o2o.hitch.auth.service.AuthService;
import com.o2o.hitch.common.api.ApiResponse;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotBlank;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Validated @RequestBody AuthRequest body) {
        return ApiResponse.success(authService.login(body.getUsername(), body.getPassword()));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@RequestHeader("Authorization") @NotBlank String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        return ApiResponse.success(authService.me(token));
    }
}
