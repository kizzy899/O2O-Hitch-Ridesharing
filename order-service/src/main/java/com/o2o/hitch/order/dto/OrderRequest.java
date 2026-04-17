package com.o2o.hitch.order.dto;

import javax.validation.constraints.NotBlank;

public class OrderRequest {

    @NotBlank(message = "TRIP_ID_REQUIRED")
    private String tripId;

    @NotBlank(message = "DRIVER_ID_REQUIRED")
    private String driverId;

    @NotBlank(message = "PASSENGER_ID_REQUIRED")
    private String passengerId;

    public String getTripId() {
        return tripId;
    }

    public void setTripId(String tripId) {
        this.tripId = tripId;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getPassengerId() {
        return passengerId;
    }

    public void setPassengerId(String passengerId) {
        this.passengerId = passengerId;
    }
}
