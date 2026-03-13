package com.heima.gateway.configuration;

import com.heima.commons.constant.HtichConstants;
import com.heima.commons.entity.SessionContext;
import com.heima.commons.helper.RedisSessionHelper;
import io.netty.buffer.ByteBufAllocator;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.NettyDataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.RequestPath;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URI;
import java.nio.CharBuffer;
import java.nio.charset.StandardCharsets;
import java.sql.Array;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/**
 * AbstractGatewayFilterFactory,
 * 这是 Spring Cloud Gateway 提供的抽象基类，
 * 用于创建自定义的网关过滤器工厂。继承此类可以创建可配置的过滤器。
 */
@Component
public class TokenAuthGatewayFilterFactory extends AbstractGatewayFilterFactory<TokenAuthGatewayFilterFactory.PathConfig> {

    @Autowired
    private RedisSessionHelper redisSessionHelper;

    TokenAuthGatewayFilterFactory() {
        super(PathConfig.class);
    }



    public boolean verifyPassPath(RequestPath requestPath, PathConfig pathConfig) {
        String[] passPathArray = pathConfig.getPathArray();
        if (null == passPathArray) {
            return false;
        }
        if (passPathArray.length == 0) {
            return false;
        }
        List<String> filterList = Arrays.stream(passPathArray).filter(path -> {
            if (path.equals(requestPath.toString())) {
                return true;
            }
            return false;
        }).collect(Collectors.toList());
        if (!filterList.isEmpty()) {
            return true;
        }
        return false;
    }

    @Override
    public List<String> shortcutFieldOrder() {
        ArrayList<String> objects = new ArrayList<>();
        objects.add("path");
        objects.add("a");
        objects.add("b");
        return objects;
//        return new ArrayList<String>() {
//            add("path"); // 通过反射，调用path的set方法
//            add("a");
//            add("b");
//
//        }};
    }

    /**
     * Spring Cloud Gateway 的核心过滤器接口，
     * 用于在请求处理过程中执行自定义逻辑
     * @param config
     * @return
     */
    @Override
    public GatewayFilter apply(PathConfig config) {
        GatewayFilter gatewayFilter = new GatewayFilter() {

            @Override
            public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
                // 获取request和response，注意：不是HttpServletRequest及HttpServletResponse
                ServerHttpRequest request = exchange.getRequest();
                ServerHttpResponse response = exchange.getResponse();

                RequestPath requestPath = request.getPath();
                String sessionToken = getSessionToken(request);
                //验证放行路径
                if (verifyPassPath(requestPath, config)) {
                    // 认证通过放行
                    return chain.filter(exchange);
                }
                //非空判断
                if (StringUtils.isEmpty(sessionToken)) {
                    // 响应未认证！
                    response.setStatusCode(HttpStatus.UNAUTHORIZED);
                    // 结束请求
                    return response.setComplete();

                }
                SessionContext context = redisSessionHelper.getSession(sessionToken);
                boolean isisValid = redisSessionHelper.isValid(context);
                //session已经失效
                if (!isisValid) {
                    // 响应未认证！
                    response.setStatusCode(HttpStatus.UNAUTHORIZED);
                    // 结束请求
                    return response.setComplete();
                }
                String accountID = context.getAccountID();
                exchange.getRequest().mutate().headers(httpHeaders -> {
                    httpHeaders.add(HtichConstants.HEADER_ACCOUNT_KEY, accountID);
                });
                // 认证通过放行
                return chain.filter(exchange);
            }
        };


        return gatewayFilter;

//        return (exchange, chain) -> {
//            // 获取request和response，注意：不是HttpServletRequest及HttpServletResponse
//            ServerHttpRequest request = exchange.getRequest();
//            ServerHttpResponse response = exchange.getResponse();
//
//            RequestPath requestPath = request.getPath();
//            String sessionToken = getSessionToken(request);
//            //验证放行路径
//            if (verifyPassPath(requestPath, config)) {
//                // 认证通过放行
//                return chain.filter(exchange);
//            }
//            //非空判断
//            if (StringUtils.isEmpty(sessionToken)) {
//                // 响应未认证！
//                response.setStatusCode(HttpStatus.UNAUTHORIZED);
//                // 结束请求
//                return response.setComplete();
//
//            }
//            SessionContext context = redisSessionHelper.getSession(sessionToken);
//            boolean isisValid = redisSessionHelper.isValid(context);
//            //session已经失效
//            if (!isisValid) {
//                // 响应未认证！
//                response.setStatusCode(HttpStatus.UNAUTHORIZED);
//                // 结束请求
//                return response.setComplete();
//            }
//            String accountID = context.getAccountID();
//            exchange.getRequest().mutate().headers(httpHeaders -> {
//                httpHeaders.add(HtichConstants.HEADER_ACCOUNT_KEY, accountID);
//            });
//            // 认证通过放行
//            return chain.filter(exchange);
//        };

    }

    public static class PathConfig {
        private String path;
        private String[] pathArray;

        private String a;
        private String b;

        public String getB() {
            return b;
        }

        public void setB(String b) {
            this.b = b;
        }

        public String getA() {
            return a;
        }

        public void setA(String a) {
            this.a = a;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            if (StringUtils.isNotEmpty(path)) {
                pathArray = path.split(";");
            }
            this.path = path;
        }

        public String[] getPathArray() {
            return pathArray;
        }
    }

    /**
     * 获取Token信息
     *
     * @param request
     * @return
     */
    private static String getSessionToken(ServerHttpRequest request) {
        String sessionToken = request.getHeaders().getFirst(HtichConstants.SESSION_TOKEN_KEY);
        if (StringUtils.isEmpty(sessionToken)) {
            sessionToken = request.getQueryParams().getFirst(HtichConstants.SESSION_TOKEN_KEY);
        }
        return sessionToken;
    }


}
