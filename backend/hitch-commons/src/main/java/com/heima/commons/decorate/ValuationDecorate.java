package com.heima.commons.decorate;

/**
 * 装饰抽象类
 */
public abstract class ValuationDecorate implements Valuation {
    protected Valuation valuation;

    public ValuationDecorate(Valuation valuation) {
        this.valuation = valuation;
    }
}
