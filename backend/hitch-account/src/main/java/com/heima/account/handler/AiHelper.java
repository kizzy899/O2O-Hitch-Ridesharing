package com.heima.account.handler;

import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heima.account.utils.HttpUtil;
import com.heima.commons.enums.BusinessErrors;
import com.heima.commons.exception.BusinessRuntimeException;
import com.heima.modules.po.AuthenticationPO;
import com.heima.modules.po.VehiclePO;
import okhttp3.*;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;

@Component
public class AiHelper {
    @Value("${baidu.apikey}")
    private String API_KEY = "18JLlM8OwIkIBOvFoQrBcUma";
    @Value("${baidu.secretkey}")
    private String SECRET_KEY = "EFpCJaj2NXCcYLNqMmlBu0GpIf5tbIGc";

    private final static Logger logger = LoggerFactory.getLogger(AiHelper.class);

    final OkHttpClient HTTP_CLIENT = new OkHttpClient().newBuilder().build();
    final String ACCESS_TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" + API_KEY + "&client_secret=" + SECRET_KEY;


    public static void main(String []args) throws IOException {
//        String code = new AiHelper().getLicense(null);
//        System.out.println(code);
        AiHelper aiHelper = new AiHelper();
        aiHelper.getAccessToken();
    }

    public void getLicense(AuthenticationPO po) throws Exception {
        String accessToken = getAccessToken();
        String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/idcard";
        String param = "id_card_side=" + "front" + "&url=" + po.getCardIdFrontPhoto() + "&detect_quality=true";
        String result = HttpUtil.post(url, accessToken, param);
        JSONObject wordsResult = JSONObject.parseObject(result).getJSONObject("words_result");
        String idCard = wordsResult.getJSONObject("公民身份号码").getString("words");
        String name = wordsResult.getJSONObject("姓名").getString("words");
        String birth = wordsResult.getJSONObject("出生").getString("words");
        if(StringUtils.isBlank(idCard) && StringUtils.isBlank(name) && StringUtils.isBlank(birth)){
            throw new BusinessRuntimeException("身份站照片视频不出来,请上传正确身份站照片");
        }
        if(StringUtils.isBlank(idCard)) {
            throw new BusinessRuntimeException("照片模糊，身份证号无法识别");
        }
        if(StringUtils.isBlank(name)) {
            throw new BusinessRuntimeException("照片模糊，姓名无法识别");
        }
        if(StringUtils.isBlank(birth)) {
            throw new BusinessRuntimeException("照片模糊，出生日期无法识别");
        }
        po.setCardId(idCard);
        po.setUseralias(name);
        po.setBirth(convertToHyphenFormat(birth));
    }

    /**
     * 将 yyyyMMdd 格式的日期字符串转换为 yyyy-MM-dd 格式
     *
     * @param sourceDate 输入的日期字符串（格式：yyyyMMdd，例如 "20010101"）
     * @return 转换后的日期字符串（格式：yyyy-MM-dd，例如 "2001-01-01"）
     * @throws ParseException 若输入格式不正确则抛出异常
     */
    public static String convertToHyphenFormat(String sourceDate) throws ParseException {
        // 1. 定义输入格式（yyyyMMdd）
        SimpleDateFormat inputFormat = new SimpleDateFormat("yyyyMMdd");
        // 2. 定义输出格式（yyyy-MM-dd）
        SimpleDateFormat outputFormat = new SimpleDateFormat("yyyy-MM-dd");

        // 3. 解析输入字符串为 Date 对象
        Date date = inputFormat.parse(sourceDate);
        // 4. 将 Date 对象格式化为输出字符串
        return outputFormat.format(date);
    }

    /*

    图像识别，获取车牌信息
    文档（行驶证识别）：https://cloud.baidu.com/doc/OCR/s/yk3h7y3ks
    文档（车牌识别）：https://cloud.baidu.com/doc/OCR/s/ck3h7y191
    获取车辆照片url
    将url下载到某个临时文件夹
    将文件编码为base64
    调百度AI接口，返回对应信息
    对比：行驶证车牌 和 车辆车牌是否一致
    如果一致，设置车牌信息，认证通过，身份变更为车主

    简化版业务流程（至少完成）：识别车辆车牌号即可

    * */
    public String getLicense(VehiclePO vehiclePO) throws Exception {
        //TODO:任务2.1-车辆信息验证代码编写-2day
        String accessToken = getAccessToken();
        // 根据行驶证，识别车辆车牌
        String license = getLicenseByDrivingLicense(accessToken, vehiclePO.getCarBackPhoto());
        // 根据车辆照片，识别车辆车牌
        String license2 = getLicenseByCarPhoto(accessToken, vehiclePO.getCarFrontPhoto());
        if (!license2.equals(license)) {
            throw new BusinessRuntimeException(BusinessErrors.LICENSE_NO_SAME);
        }
        return license;
    }

    private String getLicenseByCarPhoto(String accessToken, String carFrontPhoto) throws Exception {
        // 请求url
        String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate";
        String param = "url=" + carFrontPhoto;
        String result = HttpUtil.post(url, accessToken, param);
        String carNumber = JSONObject.parseObject(result).getJSONObject("words_result").getString("number");
        return carNumber;
    }

    private String getLicenseByDrivingLicense(String accessToken, String carBackPhoto) throws Exception {
        // 请求url
        String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/vehicle_license";
        String param = "url=" + carBackPhoto;
        String result = HttpUtil.post(url, accessToken, param);
        String carNumber = JSONObject.parseObject(result).getJSONObject("words_result").getJSONObject("号牌号码").getString("words");
        return carNumber;
    }

    public String getAccessToken() throws IOException {
        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(mediaType, "");
        Request request = new Request.Builder()
                .url(ACCESS_TOKEN_URL)
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .build();
        Response response = HTTP_CLIENT.newCall(request).execute();
        String responseString = response.body().string();
        JSONObject jsonObject = JSONObject.parseObject(responseString);
        String accessToken = jsonObject.getString("access_token");
        return accessToken;
    }

}
