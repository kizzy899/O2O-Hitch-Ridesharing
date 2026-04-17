package com.o2o.hitch.gateway.filter;

import com.netflix.zuul.context.RequestContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthPreFilterTest {

    @AfterEach
    void tearDown() {
        RequestContext.testSetCurrentContext(null);
    }

    @Test
    void shouldSkipFilterForRegisterPath() {
        RequestContext context = new RequestContext();
        context.setRequest(new MockHttpServletRequest("POST", "/api/auth/register"));
        RequestContext.testSetCurrentContext(context);

        AuthPreFilter filter = new AuthPreFilter();

        assertFalse(filter.shouldFilter());
    }

    @Test
    void shouldFilterProtectedPath() {
        RequestContext context = new RequestContext();
        context.setRequest(new MockHttpServletRequest("GET", "/api/orders"));
        RequestContext.testSetCurrentContext(context);

        AuthPreFilter filter = new AuthPreFilter();

        assertTrue(filter.shouldFilter());
    }
}
