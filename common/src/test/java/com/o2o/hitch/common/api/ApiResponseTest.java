package com.o2o.hitch.common.api;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ApiResponseTest {

    @Test
    void successShouldContainCodeAndData() {
        ApiResponse<String> response = ApiResponse.success("ok");
        Assertions.assertEquals(0, response.getCode());
        Assertions.assertEquals("ok", response.getData());
        Assertions.assertEquals("SUCCESS", response.getMessage());
    }
}
