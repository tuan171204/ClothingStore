package com.example.clothingstore.service.mail;

import com.example.clothingstore.entity.Order;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    public void sendOrderConfirmation(Order order) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // Multipart = true để hỗ trợ hình ảnh và file đính kèm sau này
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            // 1. Đưa dữ liệu vào Context
            Context context = new Context();
            context.setVariable("order", order);

            // 2. Render HTML từ Template
            // Lưu ý: Tên file là "email-order-success" (không cần đuôi .html nếu config chuẩn, hoặc thêm nếu cần)
            String html = templateEngine.process("email-order-success", context);

            // 3. Cấu hình gửi
            helper.setTo("tuanthai17122004@gmail.com"); // TODO: Thay bằng order.getEmail()
            helper.setSubject("Xác nhận đơn hàng #" + order.getId());
            helper.setText(html, true); // true = isHtml

            // 4. Gửi
            mailSender.send(message);
            System.out.println("✅ [MailService] Đã gửi mail xác nhận cho đơn hàng: " + order.getId());

        } catch (MessagingException e) {
            System.err.println("❌ [MailService] Lỗi gửi mail: " + e.getMessage());
            // Có thể throw lại ngoại lệ để RabbitMQ biết mà retry nếu muốn
        }
    }
}