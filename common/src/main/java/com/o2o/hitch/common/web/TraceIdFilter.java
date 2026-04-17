package com.o2o.hitch.common.web;

import com.o2o.hitch.common.api.TraceIdHolder;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
public class TraceIdFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpServletRequest = (HttpServletRequest) request;
        String traceId = httpServletRequest.getHeader("X-Trace-Id");
        if (traceId == null || traceId.trim().isEmpty()) {
            traceId = TraceIdHolder.getOrCreate();
        }
        TraceIdHolder.set(traceId);
        try {
            chain.doFilter(request, response);
        } finally {
            TraceIdHolder.clear();
        }
    }
}
