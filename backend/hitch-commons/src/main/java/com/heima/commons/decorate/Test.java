package com.heima.commons.decorate;

/**
 * 装饰者模式测试类
 */
public class Test {
    public static void main(String[] args) {
        // app端，10km计价
        Valuation v1 = new ValuationImpl();
        float price1 = v1.calculation(10);
        System.out.println("app端，10km计价: " + price1);

        // h5端，10km计价
        Valuation v2 = new H5Valuation(new ValuationImpl());
        float price2 = v2.calculation(10);
        System.out.println("h5端，10km计价: " + price2);

        // applet端，10km计价
        Valuation v3 = new AppletValuation(new H5Valuation(new ValuationImpl()));
        float price3 = v3.calculation(10);
        System.out.println("applet端，10km计价: " + price3);
    }
}
