package com.heima.commons.domin.bo;

public class HitchGeoBO {

    public HitchGeoBO(String targetId, GeoBO startGeo, GeoBO endGeo) {
        this.targetId = targetId;
        this.startGeo = startGeo;
        this.endGeo = endGeo;
    }


    public HitchGeoBO(String targetId) {
        this.targetId = targetId;
    }

    private String targetId; // 坐标名称
    private GeoBO startGeo;// 开始坐标具体信息
    private GeoBO endGeo; // 结束坐标具体信息

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public GeoBO getStartGeo() {
        return startGeo;
    }

    public void setStartGeo(GeoBO startGeo) {
        this.startGeo = startGeo;
    }

    public GeoBO getEndGeo() {
        return endGeo;
    }

    public void setEndGeo(GeoBO endGeo) {
        this.endGeo = endGeo;
    }
}
