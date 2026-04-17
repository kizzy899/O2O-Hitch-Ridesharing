package com.o2o.hitch.driver.dto;

import javax.validation.constraints.NotNull;

public class DriverRequest {

    @NotNull(message = "AVAILABLE_REQUIRED")
    private Boolean available;

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }
}
