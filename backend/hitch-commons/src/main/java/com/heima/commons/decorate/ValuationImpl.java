package com.heima.commons.decorate;

import java.time.Instant;

/**
 * 计价接口默认实现
 */
public class ValuationImpl implements Valuation {

    /**
     * 3公里以内起步价13元；3公里以上2.3元/公里；
     * @param km 千米
     */
    @Override
    public float calculation(float km) {
        if (km <= 3) {
            return 13;
        } else {
            return 13 + (km - 3) * 2.3f;
        }
    }
}
