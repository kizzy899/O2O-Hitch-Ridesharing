package com.o2o.hitch.trip.dto;

import javax.validation.constraints.NotBlank;

public class TripRequest {

    @NotBlank(message = "PASSENGER_ID_REQUIRED")
    private String passengerId;

    @NotBlank(message = "DEPARTURE_REQUIRED")
    private String from;

    @NotBlank(message = "DESTINATION_REQUIRED")
    private String to;

    public String getPassengerId() {
        return passengerId;
    }

    public void setPassengerId(String passengerId) {
        this.passengerId = passengerId;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }
}
