package com.heima.commons.utils;

import com.alibaba.fastjson.JSON;
import com.heima.commons.constant.HtichConstants;
import com.heima.commons.domin.bo.GeoBO;
import com.heima.commons.domin.bo.ZsetResultBO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;

import java.util.*;

public class RedisHelper {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void setObject(String prefix, String key, Object value) {
        String redisKey = getRedisKey(prefix, key);
        String serializeData = JSON.toJSONString(value);
        redisTemplate.opsForValue().set(redisKey, serializeData);
    }

    public <T> T getObject(String prefix, String key, Class<T> clazz) {
        String redisKey = getRedisKey(prefix, key);
        String serializeData = redisTemplate.opsForValue().get(redisKey);
        return JSON.parseObject(serializeData, clazz);
    }

    public void delKey(String prefix, String key) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.delete(redisKey);
    }

    public boolean exists(String prefix, String key) {
        String redisKey = getRedisKey(prefix, key);
        return redisTemplate.hasKey(redisKey);
    }

    public void addGEO(String prefix, String key, String lng, String lat, String tripId) {
        String redisKey = getRedisKey(prefix, key);
        Point point = new Point(Float.parseFloat(lng), Float.parseFloat(lat));
        redisTemplate.opsForGeo().add(redisKey, point, tripId);
    }

    public void delGEO(String prefix, String key, String tripId) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.opsForGeo().remove(redisKey, tripId);
    }

    /**
     * 计算两点之间距离
     *
     * @param prefix
     * @param key
     * @param startLocation
     * @param endLocation
     * @return
     */
    public float geoDistance(String prefix, String key, String startLocation, String endLocation) {
        String redisKey = getRedisKey(prefix, key);
        Distance distance = redisTemplate.opsForGeo()
                .distance(redisKey, startLocation, endLocation, RedisGeoCommands.DistanceUnit.KILOMETERS);//params: key, 地方名称1, 地方名称2, 距离单位
        return (float) distance.getNormalizedValue();
    }


    /**
     * 相当于执行这个命令：
     * georadius [集合名称] [经度] [纬度] [距离] [距离单位] withcoord withdist count [数值N] asc
     * 返回在单位距离范围内的坐标名称的集合、
     * 并附带上经纬度、
     * 并附带上距离、
     * 并限制返回的数量为前[数值N]条， // 注意，这并不会影响性能，因为底层是先筛选出来所有的，在返回前N条。
     * asc表示正序，距离由近到远。
     */
    public Map<String, GeoBO> geoNearByXY(String prefix, String key, float lng, float lat) {
        // [集合名称]
        String redisKey = getRedisKey(prefix, key);
        //以当前坐标为中心画圆
        // [经度] [纬度] [距离] [距离单位]
        Circle circle = new Circle(
                new Point(lng, lat),
                new Distance(HtichConstants.STROKE_DIAMETER_RANGE, Metrics.KILOMETERS)
        );
        //限制20条，可以根据实际情况调整
        RedisGeoCommands.GeoRadiusCommandArgs args =
                RedisGeoCommands.GeoRadiusCommandArgs
                        .newGeoRadiusArgs()
                        .includeDistance() // 包含距离信息（返回目标点与中心点的距离）
                        .includeCoordinates() // 包含坐标信息（返回目标点的具体坐标）
                        .sortAscending() // 按距离升序排列（近的在前）
                        .limit(20); // 限制最多返回20个结果
        //查找这个范围内的行程点
        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo()
                .radius(redisKey, circle, args);
        return geoResultPack(results);
    }


    /**
     * 根据地址名词进行搜索
     *
     * @param prefix   前缀
     * @param key      key
     * @param location 地址:行程ID+role
     * @param isStart  是否时起始行程
     * @return
     */
    public Map<String, GeoBO> geoNearByPlace(String prefix, String key, String location, boolean isStart) {
        String redisKey = getRedisKey(prefix, key);
        Distance distance = new Distance(HtichConstants.STROKE_DIAMETER_RANGE, Metrics.KILOMETERS);//params: 距离量, 距离单位
        RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().includeDistance().includeCoordinates().sortAscending().limit(20);
        GeoResults<RedisGeoCommands.GeoLocation<String>> results = redisTemplate.opsForGeo()
                .radius(redisKey, location, distance, args);//params: key, 地方名称, Circle, GeoRadiusCommandArgs
        return geoResultPack(results);

    }

    public void addHash(String prefix, String key, String hkey, String value) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.opsForHash().put(redisKey, hkey, value);
    }

    public void delHash(String prefix, String key, String... hkeys) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.opsForHash().delete(redisKey, hkeys);
    }

    public String getHash(String prefix, String key, String hkey) {
        String redisKey = getRedisKey(prefix, key);
        HashOperations<String, String, String> hashOperations = redisTemplate.opsForHash();
        return hashOperations.get(redisKey, hkey);
    }


    public Map<String, String> getHashByMap(String prefix, String key) {
        String redisKey = getRedisKey(prefix, key);
        HashOperations<String, String, String> hashOperations = redisTemplate.opsForHash();
        return hashOperations.entries(redisKey);
    }

    public void addZset(String prefix, String key, String value, float score) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.opsForZSet().add(redisKey, value, score);
    }

    public List<ZsetResultBO> getZsetSortVaues(String prefix, String key) {
        String redisKey = getRedisKey(prefix, key);
        List<ZsetResultBO> zsetResultBOList = new ArrayList<>();
        //rangeByScoreWithScores(K,Smin,Smax,[offset],[count])
        /**
         * Redis有序集合中获取按分数降序排列的元素：
         * reverseRangeByScoreWithScores：按分数范围倒序获取元素（分数从高到低）
         * 分数范围：0到100分
         * 0, 20：偏移量为0，最多获取20个元素
         * withScores：同时返回元素和对应的分数值
         * 用于获取匹配度最高的前20个行程。
         */
        Set<ZSetOperations.TypedTuple<String>> typedTuples = redisTemplate.opsForZSet().reverseRangeByScoreWithScores(redisKey, 0, 100,0,20);
        for (ZSetOperations.TypedTuple<String> typedTuple : typedTuples) {
            zsetResultBOList.add(new ZsetResultBO(typedTuple.getScore().floatValue(), typedTuple.getValue()));
        }
        return zsetResultBOList;
    }

    public float getZsetScore(String prefix, String key, String value) {
        String redisKey = getRedisKey(prefix, key);
        return redisTemplate.opsForZSet().score(redisKey, value).floatValue();
    }

    /**
     * 删除zset数据
     *
     * @param prefix
     * @param key
     * @param value
     */
    public void delZsetByKey(String prefix, String key, String value) {
        String redisKey = getRedisKey(prefix, key);
        redisTemplate.opsForZSet().remove(redisKey, value);
    }

    private String getRedisKey(String prefix, String key) {
        return prefix + key;
    }


    /**
     * GEO结果集包装
     *
     * @param results
     * @return
     */
    private Map<String, GeoBO> geoResultPack(GeoResults<RedisGeoCommands.GeoLocation<String>> results) {
        Map<String, GeoBO> geoBOMap = new HashMap();
        for (GeoResult<RedisGeoCommands.GeoLocation<String>> result : results) {
            RedisGeoCommands.GeoLocation<String> content = result.getContent();
            String name = content.getName(); // 坐标名称
            // 距离中心点的距离
            Distance dis = result.getDistance(); // 距离
            Point pos = content.getPoint(); // 经纬度
            geoBOMap.put(name, new GeoBO(name, (float) dis.getValue(), String.valueOf(pos.getX()), String.valueOf(pos.getY())));
        }
        return geoBOMap;
    }

}
