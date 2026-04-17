package com.o2o.hitch.common.api;

import java.util.UUID;

public final class TraceIdHolder {
    private static final ThreadLocal<String> HOLDER = new ThreadLocal<>();

    private TraceIdHolder() {
    }

    public static String getOrCreate() {
        String traceId = HOLDER.get();
        if (traceId == null) {
            traceId = UUID.randomUUID().toString().replace("-", "");
            HOLDER.set(traceId);
        }
        return traceId;
    }

    public static void set(String traceId) {
        HOLDER.set(traceId);
    }

    public static void clear() {
        HOLDER.remove();
    }
}
