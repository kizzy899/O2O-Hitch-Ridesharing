package com.o2o.hitch.auth.dto;

import javax.validation.constraints.NotBlank;

public class RegisterRequest {

    @NotBlank(message = "USERNAME_REQUIRED")
    private String username;

    @NotBlank(message = "PASSWORD_REQUIRED")
    private String password;

    @NotBlank(message = "ROLE_REQUIRED")
    private String role;

    @NotBlank(message = "NICKNAME_REQUIRED")
    private String nickname;

    @NotBlank(message = "MOBILE_REQUIRED")
    private String mobile;

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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
}
