package com.o2o.hitch.passenger.dto;

import javax.validation.constraints.NotBlank;

public class PassengerRequest {

    @NotBlank(message = "PASSENGER_ID_REQUIRED")
    private String passengerId;

    @NotBlank(message = "LEVEL_REQUIRED")
    private String level;

    @NotBlank(message = "EMERGENCY_CONTACT_REQUIRED")
    private String emergencyContact;

    public String getPassengerId() {
        return passengerId;
    }

    public void setPassengerId(String passengerId) {
        this.passengerId = passengerId;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }
}
