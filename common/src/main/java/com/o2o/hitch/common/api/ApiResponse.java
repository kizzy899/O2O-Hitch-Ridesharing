package com.o2o.hitch.common.api;

import java.time.Instant;

public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private long timestamp;
    private String traceId;

    public ApiResponse() {
    }

    public ApiResponse(int code, String message, T data, String traceId) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.traceId = traceId;
        this.timestamp = Instant.now().toEpochMilli();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "SUCCESS", data, TraceIdHolder.getOrCreate());
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null, TraceIdHolder.getOrCreate());
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }
}
