package com.heima.commons.decorate;

/**
 * H5计价、H5装饰对象
 */
public class H5Valuation extends ValuationDecorate {
    public H5Valuation(Valuation valuation) {
        super(valuation);
    }

    @Override
    public float calculation(float km) {
        float beforeCost = valuation == null ? 0f : valuation.calculation(km);
        return beforeCost + km * 1;
    }
}
