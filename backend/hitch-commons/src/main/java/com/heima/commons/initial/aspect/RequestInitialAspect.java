package com.heima.commons.initial.aspect;

import com.heima.commons.initial.annotation.RequestInitial;
import com.heima.commons.initial.factory.InitialParserFactory;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;


@Aspect // 切面
public class RequestInitialAspect {
    @Autowired
    private HttpServletRequest request;

    /**
     * 切点
     */
    @Pointcut("@annotation(com.heima.commons.initial.annotation.RequestInitial)")
    public void annotationPoinCut() {
    }

    @Around("annotationPoinCut()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        // 根据连接点，获取到对应的注解
        RequestInitial requestInitial = getRequestInitial(pjp);
        // 获取方法上的参数
        Object[] parameterValues = pjp.getArgs();

        if (null != requestInitial) {
            //拦截后给属性赋值
            // default
            InitialParserFactory.initialDefValue(parameterValues, requestInitial);
        }
        Object proceed = pjp.proceed(parameterValues);// 执行目标方法
        System.out.println("后置增强");
        return proceed;
    }

    private RequestInitial getRequestInitial(ProceedingJoinPoint pjp) {
        // 获取当前被拦截方法的签名信息, 签名包含了方法名、声明类型、参数类型等信息
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        //获取切入点所在的方法
        Method method = signature.getMethod();
        return method.getAnnotation(RequestInitial.class);
    }

}
