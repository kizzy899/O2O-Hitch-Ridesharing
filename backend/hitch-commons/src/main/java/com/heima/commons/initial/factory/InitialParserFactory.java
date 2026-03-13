package com.heima.commons.initial.factory;

import com.heima.commons.domin.po.PO;
import com.heima.commons.domin.vo.VO;
import com.heima.commons.groups.Group;
import com.heima.commons.initial.InitialParser;
import com.heima.commons.initial.annotation.InitialResolver;
import com.heima.commons.initial.annotation.RequestInitial;
import com.heima.commons.utils.CommonsUtils;
import com.heima.commons.utils.reflect.ReflectUtils;
import com.heima.commons.utils.reflect.wrap.WrapObject;
import com.heima.commons.utils.reflect.wrap.WrapObjectFactory;
import com.heima.commons.utils.reflect.wrap.WrapProperty;
import org.apache.commons.collections4.CollectionUtils;

import java.lang.annotation.Annotation;
import java.util.Arrays;

public class InitialParserFactory {

    public static PO initialDefValueForPO(PO po) {
        Object vo = ReflectUtils.newInstance(po.getVO());
        initialDefValue(vo, Group.All.class);
        return CommonsUtils.toPO((VO) vo);
    }

    public static void initialDefValueForVO(VO vo) {
        initialDefValue(vo, Group.All.class);
    }

    /**
     *
     * @param objArray 方法上面的参数，有多个，所以是数组
     * @param requestInitial 方法上的注解
     */
    public static void initialDefValue(Object[] objArray, RequestInitial requestInitial) {
        if (null != objArray && objArray.length > 0) {
            for (Object obj : objArray) {
                // 判断参数是否是VO,如果是VO类型的，则进行属性赋值
                if (obj instanceof VO) {
                    //request可能有多个入参，只对VO类赋值
                    initialDefValue(obj, requestInitial);
                }
            }
        }
    }

    /**
     *
     * @param obj 方法的参数
     * @param requestInitial 方法上面的注解
     */
    public static void initialDefValue(Object obj, RequestInitial requestInitial) {
        // requestInitial.groups() 拿到requestInitial里面的gruop属性
        initialDefValue(obj, requestInitial.groups());
    }

    /**
     *
     * @param obj 方法上面的参数
     * @param groups groups
     */
    public static void initialDefValue(Object obj, Class<?>... groups) {
        //Wrapper赋值工具 wrapObject
        WrapObject wrapObject = WrapObjectFactory.getWarpObject(obj);
        // 初始化的解析器工厂
        InitialParserFactory initialParserFactory = new InitialParserFactory();
        for (WrapProperty property : wrapObject.getPropertyList()) {
            // 根据属性名称，获取属性的值
            Object value = wrapObject.getValue(property.getPropName());
            if (null != value) {
                //属性有值的话，跳过
                continue;
            }
            //从VO的中拿到Resolver注解定义的生成器
            // 根据属性，获取修饰这个属性的注解
            InitialResolver initialResolver = getInitialResolver(property);
            // 如果属性上面没有加 InitialResolver ,直接跳过
            if (initialResolver == null) {
                continue;
            }
            //判断注解的group信息，resolver和controller匹配上就反射生成resolver（属性值生成器）
            // groups RequestInitial注解里面的分组信息
            InitialParser initialParser = initialParserFactory.getInitialParser(property, initialResolver, groups);
            if (null != initialParser && initialParser.isMatch(property.getDataType())) {
                //获取值，通过wrapper工具赋值上去（反射）。
                wrapObject.setValue(property.getPropName(), initialParser.getDefaultValue(property.getDataType(), initialResolver));
            }
        }
    }


    public static InitialResolver getInitialResolver(WrapProperty property) {
        Annotation[] annotations = property.getAnnotations();
        return getInitialResolverAnnotation(annotations);
    }


    /**
     *
     * @param wrapProperty 要赋值的属性
     * @param initialResolver 属性上面定义的注解
     * @param groups 方法上面的注解里面的groups
     * @return
     */
    public static InitialParser getInitialParser(WrapProperty wrapProperty, InitialResolver initialResolver, Class[] groups) {
        // 属性上面的注解里面的groups信息
        Class<?>[] groupArray = initialResolver.groups();
        if (groupArray == null || groups == null) {
            return null;
        }
        if (groupArray.length == 0 || groups.length == 0) {
            return null;
        }
        boolean flag = false;
        if (groups[0] == Group.All.class) {
            flag = true;
        } else {
            // groupArray 属性上面的groups信息
            // groups 方法上面的groups信息
            flag = CollectionUtils.containsAny(Arrays.asList(groupArray), groups);
        }
        return flag ? ReflectUtils.newInstance(initialResolver.resolver().getResolverClass()) : null;
    }


    private static InitialResolver getInitialResolverAnnotation(Annotation[] annotations) {
        if (null != annotations && annotations.length > 0) {
            for (Annotation annotation : annotations) {
                if (annotation instanceof InitialResolver) {
                    return (InitialResolver) annotation;
                }
            }
        }
        return null;
    }


}
