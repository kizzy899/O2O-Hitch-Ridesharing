package com.heima.account.testSpring;


import lombok.Data;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;

import javax.annotation.PostConstruct;
import java.util.Map;
import java.util.Properties;

public class Student implements BeanFactoryAware, ApplicationContextAware, EnvironmentAware, InitializingBean {
    private int id;
    private String name;

    private Course course;

    public Student() {
        System.out.println(Count.count++ + ".无参构造方法");
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    static ApplicationContext applicationContext;

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        System.out.println(Count.count++ + ".setter注入");
        // @Autowired 和 @Resource 在setter依赖注入之后执行
        this.course = course;
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        // Spring是个框架，他是使用Java语言编写的
        // 在Spring的代码中，他也会创建很多对象
        // 比如：BeanFactory ApplicationContext Environment
        // 如果想要使用Spring的内部对象，我们就需要感知出来，Aware的中文意思就是感知的意思
        // Aware接口，就是感知接口，Spring会主动将一些对象，注入到我们的类中
        // BeanFactoryAware, ApplicationContextAware, EnvironmentAware
        System.out.println(Count.count++ + ".检查aware相关接口，并设置相关依赖");
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        // ApplicationContext和BeanFactory的区别
        // ApplicationContext是一个接口，BeanFactory也是一个接口
        // ApplicationContext的核心实现类是AbstractRefreshableApplicationContext
        // BeanFactory的核心实现类是DefaultListableBeanFactory
        // BeanFactory是基础容器，ApplicationContext内部持有了一个BeanFactory的引用，并且ApplicationContext也实现了BeanFactory接口
        // 那就意味着BeanFactory有的功能，ApplicationContext都有
        // ApplicationContext除了基本的容器功能之外，还扩展了国际化支持、事件发布机制
        this.applicationContext = applicationContext;
    }

    @Override
    public void setEnvironment(Environment environment) {
        // Environment，Spring会主动将环境变量注入到我们的类中
        // 系统属性 / 环境变量
        // 系统属性：由JVM设置或通过命令行 -D 参数传递
        // 环境变量：由操作系统设置，在JVM启动前就已经存在
        // @Value注解就是从Environment中获取值的
//        System.out.println(environment.getProperty("baidu.apikey"));


        Properties properties = System.getProperties();
        Object x = properties.get("x");

        Map<String, String> getenv = System.getenv();
        String xx = environment.getProperty("xx");
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println(Count.count++ + ".InitializingBean.afterPropertiesSet");
    }

    @PostConstruct
    public void a(){

    }

    public void b() {
        System.out.println(Count.count++ + ".init-method");
    }

//    @PostConstruct
//    public void postConstruct() {
//        System.out.println(Count.count++ + ".postConstruct");
//    }
}
