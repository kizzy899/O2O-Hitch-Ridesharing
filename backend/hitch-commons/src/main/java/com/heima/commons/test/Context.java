package com.heima.commons.test;

/**
 * @Description TODO
 * @Author 冯欢
 * @Date 2025/8/1
 */
public class Context {
    Strategy strategy;

    public Context(Strategy strategy) {
        this.strategy = strategy;
    }

    public void contextInterface() {
        strategy.way();
    }
}
