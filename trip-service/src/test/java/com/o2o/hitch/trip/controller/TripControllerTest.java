package com.o2o.hitch.trip.controller;

import com.o2o.hitch.common.exception.BusinessException;
import com.o2o.hitch.trip.dto.TripRequest;
import com.o2o.hitch.trip.service.TripService;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TripControllerTest {

    @Test
    void createTripShouldRejectPassengerOperatingAnotherPassengerTrip() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);
        TripRequest request = new TripRequest();
        request.setPassengerId("passenger002");
        request.setFrom("A");
        request.setTo("B");

        assertThrows(BusinessException.class, () ->
                controller.createTrip(request, "PASSENGER", "passenger001"));
    }

    @Test
    void listTripsShouldRejectPassengerQueryingAnotherPassengerTrips() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);

        assertThrows(BusinessException.class, () ->
                controller.listTrips("passenger002", null, "PASSENGER", "passenger001"));
    }

    @Test
    void listTripsShouldAllowAdminQueryingAnyPassengerTrips() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);

        assertDoesNotThrow(() ->
                controller.listTrips("passenger002", null, "ADMIN", "admin001"));
    }

    @Test
    void getTripShouldRejectPassengerReadingAnotherPassengersTrip() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);
        Map<String, Object> trip = new HashMap<>();
        trip.put("passengerId", "passenger002");
        when(tripService.getById("TRIP-1")).thenReturn(trip);

        assertThrows(BusinessException.class, () ->
                controller.getTrip("TRIP-1", "PASSENGER", "passenger001"));
    }

    @Test
    void getTripShouldAllowAdminReadingAnyTrip() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);

        assertDoesNotThrow(() ->
                controller.getTrip("TRIP-1", "ADMIN", "admin001"));
    }

    @Test
    void matchDriverShouldRejectDriverBindingAnotherDriverId() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);

        assertThrows(BusinessException.class, () ->
                controller.matchDriver("TRIP-2", "driver002", "DRIVER", "driver001"));
    }

    @Test
    void matchDriverShouldAllowAdminBindingAnyDriverId() {
        TripService tripService = mock(TripService.class);
        TripController controller = new TripController(tripService);

        assertDoesNotThrow(() ->
                controller.matchDriver("TRIP-2", "driver002", "ADMIN", "admin001"));
    }
}
