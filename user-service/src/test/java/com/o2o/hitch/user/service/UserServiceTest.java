package com.o2o.hitch.user.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UserServiceTest {

    @Test
    void profileShouldThrowWhenUserDoesNotExist() {
        UserService userService = new UserService();
        assertThrows(BusinessException.class, () -> userService.profile("not-exists"));
    }

    @Test
    void registerShouldThrowWhenUserAlreadyExists() {
        UserService userService = new UserService();
        userService.register("dupe001", "PASSENGER", "dupe-1", "13800001011", "123456");
        assertThrows(BusinessException.class, () -> userService.register("dupe001", "PASSENGER", "dupe-2", "13800001012", "123456"));
    }

    @Test
    void registerShouldThrowWhenRoleIsNotAllowed() {
        UserService userService = new UserService();
        assertThrows(BusinessException.class, () -> userService.register("admin002", "ADMIN", "admin-2", "13800001013", "123456"));
    }

    @Test
    void registerShouldReturnCreatedUserProfile() {
        UserService userService = new UserService();
        Map<String, Object> profile = userService.register("driver002", "DRIVER", "driver-2", "13800001014", "123456");
        assertEquals("driver002", profile.get("userId"));
        assertEquals("DRIVER", profile.get("role"));
    }
}
