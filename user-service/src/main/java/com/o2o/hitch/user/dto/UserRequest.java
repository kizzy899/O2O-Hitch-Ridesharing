package com.o2o.hitch.user.dto;

import javax.validation.constraints.NotBlank;

public class UserRequest {

    @NotBlank(message = "USER_ID_REQUIRED")
    private String userId;

    @NotBlank(message = "ROLE_REQUIRED")
    private String role;

    @NotBlank(message = "NICKNAME_REQUIRED")
    private String nickname;

    @NotBlank(message = "MOBILE_REQUIRED")
    private String mobile;

    @NotBlank(message = "PASSWORD_REQUIRED")
    private String password;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
