package com.o2o.hitch.passenger.service;

import com.o2o.hitch.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;

class PassengerServiceTest {

    @Test
    void profileShouldThrowWhenPassengerNotFound() {
        PassengerService passengerService = new PassengerService();
        assertThrows(BusinessException.class, () -> passengerService.profile("p-not-found"));
    }
}
