package com.o2o.hitch.user.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class UserServiceTest {

    @Test
    void profileShouldThrowWhenUserDoesNotExist() {
        UserService userService = new UserService();
        assertThrows(BusinessException.class, () -> userService.profile("not-exists"));
    }
}
