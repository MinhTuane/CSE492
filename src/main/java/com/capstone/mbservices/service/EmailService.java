package com.capstone.mbservices.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.entity.TestRide;
import com.capstone.mbservices.entity.MaintenanceService;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${app.frontend.url:http://localhost:3001}")
    private String frontendUrl;

    @Async
    public void sendOrderConfirmationEmail(Order order) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("Order Confirmation #" + order.getId() + " from MBServices");

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<h2>Thank you for your order at MBServices!</h2>");
            htmlContent.append("<p>Hello <strong>").append(order.getUser().getFirstname()).append("</strong>,</p>");
            htmlContent.append("<p>Your order has been successfully confirmed.</p>");
            
            htmlContent.append("<h3>Order Details:</h3>");
            htmlContent.append("<ul>");
            htmlContent.append("<li>Order ID: ").append(order.getId()).append("</li>");
            htmlContent.append("<li>Total Amount: ").append(String.format("%,.0f", order.getTotalAmount())).append(" VND</li>");
            htmlContent.append("<li>Payment Method: ").append(order.getPaymentMethod()).append("</li>");
            htmlContent.append("<li>Status: ").append(order.getStatus()).append("</li>");
            htmlContent.append("<li>Shipping Address: ").append(order.getShippingAddress()).append("</li>");
            htmlContent.append("</ul>");
            
            htmlContent.append("<p>We will contact you shortly to arrange the delivery.</p>");
            htmlContent.append("<p>Best regards,<br>MBServices Team</p>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send order confirmation email to {}", order.getUser().getEmail(), e);
        }
    }

    @Async
    public void sendTestRideConfirmationEmail(TestRide testRide) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(testRide.getUser().getEmail());
            helper.setSubject("Test Ride Booking Confirmation - MBServices");

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<h2>Test Ride Booking Confirmation</h2>");
            htmlContent.append("<p>Hello <strong>").append(testRide.getUser().getFirstname()).append("</strong>,</p>");
            htmlContent.append("<p>You have successfully booked a test ride for: <strong>")
                       .append(testRide.getMotorcycle().getBrand()).append(" ")
                       .append(testRide.getMotorcycle().getModel()).append("</strong>.</p>");
            
            htmlContent.append("<h3>Appointment Details:</h3>");
            htmlContent.append("<ul>");
            htmlContent.append("<li>Time: ").append(testRide.getScheduleDate().toString()).append("</li>");
            htmlContent.append("<li>Duration: ").append(testRide.getDuration()).append(" minutes</li>");
            if (testRide.getStore() != null) {
                htmlContent.append("<li>Location: ").append(testRide.getStore().getName()).append(" - ").append(testRide.getStore().getAddress()).append("</li>");
            }
            htmlContent.append("<li>Status: ").append(testRide.getStatus()).append("</li>");
            htmlContent.append("</ul>");
            
            htmlContent.append("<p>Please arrive on time and bring a valid driver's license.</p>");
            htmlContent.append("<p>Best regards,<br>MBServices Team</p>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send test ride confirmation email to {}", testRide.getUser().getEmail(), e);
        }
    }

    @Async
    public void sendMaintenanceConfirmationEmail(MaintenanceService service) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(service.getUser().getEmail());
            helper.setSubject("Maintenance Booking Confirmation - MBServices");

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<h2>Maintenance/Repair Booking Confirmation</h2>");
            htmlContent.append("<p>Hello <strong>").append(service.getUser().getFirstname()).append("</strong>,</p>");
            htmlContent.append("<p>Your maintenance appointment for <strong>")
                       .append(service.getMotorcycle().getBrand()).append(" ")
                       .append(service.getMotorcycle().getModel()).append("</strong> has been recorded.</p>");
            
            htmlContent.append("<h3>Appointment Details:</h3>");
            htmlContent.append("<ul>");
            htmlContent.append("<li>Service Type: ").append(service.getServiceType()).append("</li>");
            htmlContent.append("<li>Time: ").append(service.getScheduleDate().toString()).append("</li>");
            if (service.getStore() != null) {
                htmlContent.append("<li>Branch: ").append(service.getStore().getName()).append(" - ").append(service.getStore().getAddress()).append("</li>");
            }
            if (service.getCost() != null) {
                htmlContent.append("<li>Estimated Cost: ").append(String.format("%,.0f", service.getCost())).append(" VND</li>");
            }
            htmlContent.append("</ul>");
            
            htmlContent.append("<p>Best regards,<br>MBServices Team</p>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send maintenance confirmation email to {}", service.getUser().getEmail(), e);
        }
    }
    
    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - MBServices");

            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;

            StringBuilder htmlContent = new StringBuilder();
            htmlContent.append("<h2>Password Reset Request</h2>");
            htmlContent.append("<p>Hello,</p>");
            htmlContent.append("<p>We received a request to reset your password for your MBServices account.</p>");
            htmlContent.append("<p>Click the link below to reset your password:</p>");
            htmlContent.append("<p><a href=\"").append(resetUrl).append("\" style=\"background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;\">Reset Password</a></p>");
            htmlContent.append("<p>Or copy and paste this link into your browser:</p>");
            htmlContent.append("<p>").append(resetUrl).append("</p>");
            htmlContent.append("<p><strong>This link will expire in 1 hour.</strong></p>");
            htmlContent.append("<p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>");
            htmlContent.append("<p>Best regards,<br>MBServices Team</p>");

            helper.setText(htmlContent.toString(), true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
        }
    }
}