package com.heima.account.handler;

import com.heima.account.utils.Base64Util;
import com.heima.account.utils.FileUtil;
import com.heima.account.utils.HttpUtil;
import com.heima.modules.po.VehiclePO;
import okhttp3.*;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;

@Component
public class AiHelperTest {

    final OkHttpClient HTTP_CLIENT = new OkHttpClient().newBuilder().build();

    public static void main(String []args) throws IOException {
        new AiHelperTest().getLicense(null);
    }


    public String getLicense(VehiclePO vehiclePO) throws IOException {
        // 行驶证
        vehicleLicense();
        // 车牌
        licensePlate();
        return null;
    }

    public String vehicleLicense() {
        // 请求url
        String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/vehicle_license";
        try {
            // 本地文件路径
            String filePath = "C:\\Users\\itcast\\Pictures\\carPass.png";
            byte[] imgData = FileUtil.readFileByBytes(filePath);
            String imgStr = Base64Util.encode(imgData);
            String imgParam = URLEncoder.encode(imgStr, "UTF-8");

            String param = "image=" + imgParam;

            // 注意这里仅为了简化编码每一次请求都去获取access_token，线上环境access_token有过期时间， 客户端可自行缓存，过期后重新获取。
            String accessToken = getToken();

            String result = HttpUtil.post(url, accessToken, param);
            System.out.println(result);
            return result;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public String licensePlate() {
        // 请求url
        String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate";
        try {
            // 本地文件路径
            String filePath = "C:\\Users\\itcast\\Pictures\\OIP-C.jpg";
            byte[] imgData = FileUtil.readFileByBytes(filePath);
            String imgStr = Base64Util.encode(imgData);
            String imgParam = URLEncoder.encode(imgStr, "UTF-8");

            String param = "image=" + imgParam;

            // 注意这里仅为了简化编码每一次请求都去获取access_token，线上环境access_token有过期时间， 客户端可自行缓存，过期后重新获取。
            String accessToken = getToken();

            String result = HttpUtil.post(url, accessToken, param);
            System.out.println(result);
            return result;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }


    public String getToken() throws IOException {
        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(mediaType, "");
        Request request = new Request.Builder()
                .url("https://aip.baidubce.com/oauth/2.0/token?client_id=GRElhRhhpcCm1X8Wk29jJz1j&client_secret=mRV5B5JYEhP8nheKdhgnGjEVk15jRoq1&grant_type=client_credentials")
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .build();
        Response response = HTTP_CLIENT.newCall(request).execute();

        return new JSONObject(response.body().string()).getString("access_token");
    }
}
