package com.heima.account.testSpring;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;

/**
 * @Description TODO
 * @Author 冯欢
 * @Date 2025/8/1
 */
public class MyBeanPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if(beanName.equals("student")){
            System.out.println(Count.count++ + ".BeanPostProcessor.Before前置增强");
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if(beanName.equals("student")){
            System.out.println(Count.count++ + ".BeanPostProcessor.After后置增强");
        }
        return BeanPostProcessor.super.postProcessAfterInitialization(bean, beanName);
    }
}
