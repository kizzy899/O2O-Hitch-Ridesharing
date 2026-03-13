package com.heima.commons.decorate;

/**
 * 小程序计价、小程序装饰对象
 */
public class AppletValuation extends ValuationDecorate{
    public AppletValuation(Valuation valuation) {
        super(valuation);
    }
    @Override
    public float calculation(float km) {
        float beforeCost = valuation == null ? 0f : valuation.calculation(km);
        return beforeCost - km * 0.5f;
    }
}
