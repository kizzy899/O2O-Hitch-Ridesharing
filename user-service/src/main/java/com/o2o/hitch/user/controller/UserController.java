package com.o2o.hitch.user.controller;

import com.o2o.hitch.common.api.ApiResponse;
import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.user.dto.UserRequest;
import com.o2o.hitch.user.service.UserService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@Validated
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> registerOrUpdate(@Validated @RequestBody UserRequest body,
                                                              @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            throw new BusinessException(4035, "ROLE_NOT_ALLOWED_FOR_USER_UPSERT");
        }
        return ApiResponse.success(userService.registerOrUpdate(body.getUserId(), body.getRole(), body.getNickname(), body.getMobile(), body.getPassword()));
    }

    @GetMapping("/{userId}")
    public ApiResponse<Map<String, Object>> getUser(@PathVariable String userId, @RequestHeader("X-User-Role") String role) {
        return ApiResponse.success(userService.profile(userId));
    }

    @GetMapping("/internal/{userId}/auth-profile")
    public ApiResponse<Map<String, Object>> authProfile(@PathVariable String userId) {
        return ApiResponse.success(userService.authProfile(userId));
    }
}
