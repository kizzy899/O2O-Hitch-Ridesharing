package com.o2o.hitch.gateway.filter;

import com.netflix.zuul.ZuulFilter;
import com.netflix.zuul.context.RequestContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Component
public class AuthPreFilter extends ZuulFilter {

    @Value("${security.jwt.secret:O2O_DEMO_SECRET}")
    private String jwtSecret;

    private static final List<String> OPEN_PATHS = Arrays.asList(
            "/api/auth/login",
            "/actuator/health"
    );

    @Override
    public String filterType() {
        return "pre";
    }

    @Override
    public int filterOrder() {
        return 0;
    }

    @Override
    public boolean shouldFilter() {
        HttpServletRequest request = RequestContext.getCurrentContext().getRequest();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        return OPEN_PATHS.stream().noneMatch(path::startsWith);
    }

    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
        HttpServletRequest request = ctx.getRequest();
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            deny(ctx, "TOKEN_MISSING");
            return null;
        }
        try {
            String token = authHeader.substring(7);
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .parseClaimsJws(token)
                    .getBody();
            String role = String.valueOf(claims.get("role"));
            String userId = String.valueOf(claims.get("userId"));
            request.setAttribute("userId", userId);
            ctx.addZuulRequestHeader("X-User-Id", userId);
            ctx.addZuulRequestHeader("X-User-Role", role);
            if (request.getRequestURI().startsWith("/api/orders") && !("DRIVER".equals(role) || "PASSENGER".equals(role) || "ADMIN".equals(role))) {
                deny(ctx, "ROLE_FORBIDDEN");
            }
        } catch (Exception ex) {
            deny(ctx, "TOKEN_INVALID");
        }
        return null;
    }

    private void deny(RequestContext ctx, String message) {
        ctx.setSendZuulResponse(false);
        ctx.setResponseStatusCode(HttpStatus.UNAUTHORIZED.value());
        ctx.setResponseBody("{\"code\":4010,\"message\":\"" + message + "\",\"data\":null}");
        ctx.getResponse().setContentType("application/json;charset=UTF-8");
    }
}
