package com.heima.stroke.rabbitmq;

import com.alibaba.fastjson.JSON;
import com.heima.modules.vo.StrokeVO;
import com.heima.stroke.configuration.RabbitConfig;
import com.heima.stroke.handler.StrokeHandler;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.BatchMessageListener;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.*;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 行程消费者类
 *
 */
@Component
public class MQConsumer{
    private final static Logger logger = LoggerFactory.getLogger(MQConsumer.class);

    @Autowired
    private StrokeHandler strokeHandler;


    /**
     * 行程超时监听
     *
     * @param massage
     * @param channel
     * @param tag
     */
    @RabbitListener(bindings = {@QueueBinding(
            value = @Queue(value = RabbitConfig.STROKE_DEAD_QUEUE, durable = "true"),
            exchange = @Exchange(value = RabbitConfig.STROKE_DEAD_QUEUE_EXCHANGE),
            key = RabbitConfig.STROKE_DEAD_KEY)
    })
    // 在当前场景中：由于方法直接被 @RabbitListener 标注，且只有一个处理方法，所以 @RabbitHandler 不是必需的。
    @RabbitHandler
    /**
     * @RabbitListener(queues = "test.queue")
     * public class MessageHandler {
     *
     *     @RabbitHandler
     *     public void handleString(String message) {
     *         // 处理字符串消息
     *     }
     *
     *     @RabbitHandler
     *     public void handleInteger(Integer number) {
     *         // 处理整数消息
     *     }
     * }
     */
    /**
     * tag（delivery tag）是由 RabbitMQ Broker 生成并传递给消费者的。
     * 每当消息被投递给消费者时，Broker 会为每条消息分配一个唯一的 delivery tag，这个 tag 在同一个 channel 中是唯一的。
     */
    public void processStroke(Message massage, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long tag) {
        //TODO:任务4.3-接收死信队列消息(以下代码已完成，用于验证配置和发送无误)
        StrokeVO strokeVO = JSON.parseObject(massage.getBody(), StrokeVO.class);
        logger.info("get dead msg:{}",massage.getBody());
        if (null == strokeVO) {
            return;
        }
        try {
            strokeHandler.timeoutHandel(strokeVO);
            //手动确认机制
            //basicAck(tag, false)：只确认 delivery tag 为 tag 的这一条消息
            //basicAck(tag, true)：确认所有 delivery tag 小于或等于 tag 的消息，即批量确认
            channel.basicAck(tag, false);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}
