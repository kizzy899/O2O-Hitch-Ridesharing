package com.heima.commons.domin.bo;

import com.heima.commons.utils.CommonsUtils;

import java.io.Serializable;
import java.util.Objects;

public class GeoBO implements Serializable {
    public GeoBO(String targetId, float distance, String lng, String lat) {
        this.targetId = targetId;
        this.distance = distance;
        this.lng = lng;
        this.lat = lat;
    }

    public GeoBO() {

    }

    private String targetId; // 坐标名称
    private float distance; // 距离
    private String lng; // 经度
    private String lat;// 纬度


    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public float getDistance() {
        return distance;
    }

    public void setDistance(float distance) {
        this.distance = distance;
    }

    public String getLng() {
        return lng;
    }

    public void setLng(String lng) {
        this.lng = lng;
    }

    public String getLat() {
        return lat;
    }

    public void setLat(String lat) {
        this.lat = lat;
    }

    @Override
    public String toString() {
        return "GeoBO{" +
                "targetId='" + targetId + '\'' +
                '}';
    }

    /**
     * 这段代码将GeoBO对象中的距离值转换为千米表示：
     * 1.使用NumberFormat格式化浮点数，保留1位小数
     * 2.将格式化后的字符串重新解析为Float类型
     * 3.主要用于将距离值以标准的千米单位展示
     * 例如，distance为12.3456时，会格式化为12.3并返回。
     */
    public Float toKilometre() {
        return Float.parseFloat(CommonsUtils.floatToStr(distance));
    }

    public static void main(String[] args) {
        System.out.println(Float.parseFloat(CommonsUtils.floatToStr(0.1f)));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GeoBO geoBO = (GeoBO) o;
        return targetId.equals(geoBO.targetId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(targetId);
    }
}
