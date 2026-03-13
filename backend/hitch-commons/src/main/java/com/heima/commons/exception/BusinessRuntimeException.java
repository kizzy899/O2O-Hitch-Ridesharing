package com.heima.commons.exception;

import com.heima.commons.enums.BusinessErrors;

public class BusinessRuntimeException extends RuntimeException {

    private BusinessErrors businessError;

    public BusinessRuntimeException(BusinessErrors businessError) {
        super(businessError.getMsg());
        this.businessError = businessError;
    }

    public BusinessRuntimeException(BusinessErrors businessError, String message) {
        super(message);
        this.businessError = businessError;
    }

    public BusinessRuntimeException(String message) {
        super(message);
        this.businessError = BusinessErrors.SYSTEM_ERROR;
    }

    public BusinessErrors getBusinessError() {
        return businessError;
    }
}
