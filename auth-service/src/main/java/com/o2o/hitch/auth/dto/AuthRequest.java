package com.o2o.hitch.auth.dto;

import javax.validation.constraints.NotBlank;

public class AuthRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    private String username;

    @NotBlank(message = "PASSWORD_REQUIRED")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
