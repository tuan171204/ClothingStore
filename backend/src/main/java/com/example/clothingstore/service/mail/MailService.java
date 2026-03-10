package com.example.clothingstore.service.mail;

import com.example.clothingstore.entity.Order;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
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

    public void sendResetPasswordEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[Clothing Store] Yêu cầu khôi phục mật khẩu");
        message.setText("Chào bạn,\n\n" +
                "Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để thiết lập mật khẩu mới (Link này chỉ có hiệu lực trong 15 phút):\n" +
                resetLink + "\n\n" +
                "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.");

        mailSender.send(message);
    }

    public void sendOrderConfirmation(Order order) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            Context context = new Context();
            context.setVariable("order", order);

            String html = templateEngine.process("email-order-success", context);

            // Cấu hình gửi
            helper.setTo("tuanthai17122004@gmail.com"); // TODO: Thay bằng order.getEmail()
            helper.setSubject("Xác nhận đơn hàng #" + order.getId());
            helper.setText(html, true); // true = isHtml

            // Gửi
            mailSender.send(message);
            System.out.println("✅ [MailService] Đã gửi mail xác nhận cho đơn hàng: " + order.getId());

        } catch (MessagingException e) {
            System.err.println("❌ [MailService] Lỗi gửi mail: " + e.getMessage());
            // Có thể throw lại ngoại lệ để RabbitMQ biết mà retry nếu muốn
        }
    }
}