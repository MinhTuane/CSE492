package com.capstone.mbservices.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.capstone.mbservices.entity.Order;
import com.capstone.mbservices.entity.Staff;
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
        } catch (Exception e) {
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
        } catch (Exception e) {
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
        } catch (Exception e) {
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
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", toEmail, e);
        }
    }

    @Async
    public void sendStaffAssignedEmail(TestRide testRide, Staff staff) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(testRide.getUser().getEmail());
            helper.setSubject("✅ Your appointment has been confirmed - MBServices");

            String staffName = (staff.getUser() != null)
                ? (staff.getUser().getFirstname() + " " + staff.getUser().getLastname()).trim()
                : "N/A";
            String staffPhone = (staff.getUser() != null && staff.getUser().getPhone() != null)
                ? staff.getUser().getPhone()
                : "Contact store";

            String scheduleStr = testRide.getScheduleDateTime() != null
                ? testRide.getScheduleDateTime().toString().replace("T", " ").substring(0, 16)
                : (testRide.getScheduleDate() != null ? testRide.getScheduleDate().toString().replace("T", " ").substring(0, 16) : "N/A");

            StringBuilder html = new StringBuilder();
            html.append("<div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;'>");
            html.append("<div style='background:#dc2626;padding:20px 24px;border-radius:10px 10px 0 0;'>");
            html.append("<h1 style='color:white;margin:0;font-size:20px;'>MBServices - Appointment Confirmed</h1>");
            html.append("</div>");
            html.append("<div style='background:white;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;'>");
            html.append("<p style='color:#374151;'>Hello <strong>").append(testRide.getUser().getFirstname()).append("</strong>,</p>");
            html.append("<p style='color:#374151;'>Your appointment has been confirmed and a staff member has been assigned. Here are the details:</p>");

            html.append("<div style='background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;'>");
            html.append("<h3 style='color:#111827;margin:0 0 12px;font-size:15px;'>📅 Appointment Details</h3>");
            html.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;width:140px;'>Bike:</td><td style='color:#111827;font-weight:600;'>")
                .append(testRide.getMotorcycle().getBrand()).append(" ").append(testRide.getMotorcycle().getModel()).append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Date & Time:</td><td style='color:#111827;font-weight:600;'>").append(scheduleStr).append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Duration:</td><td style='color:#111827;font-weight:600;'>")
                .append(testRide.getDuration() != null ? testRide.getDuration() + " minutes" : "30 minutes").append("</td></tr>");
            if (testRide.getStore() != null) {
                html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Location:</td><td style='color:#111827;font-weight:600;'>")
                    .append(testRide.getStore().getName()).append(" — ").append(testRide.getStore().getAddress()).append("</td></tr>");
            }
            html.append("</table></div>");

            html.append("<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;'>");
            html.append("<h3 style='color:#1d4ed8;margin:0 0 12px;font-size:15px;'>👤 Assigned Staff</h3>");
            html.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;width:140px;'>Staff Name:</td><td style='color:#1e40af;font-weight:700;font-size:16px;'>").append(staffName).append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Phone Number:</td><td style='color:#1e40af;font-weight:700;font-size:16px;'>").append(staffPhone).append("</td></tr>");
            if (staff.getDepartment() != null) {
                html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Department:</td><td style='color:#374151;'>").append(staff.getDepartment()).append("</td></tr>");
            }
            html.append("</table></div>");

            html.append("<div style='background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;color:#92400e;'>");
            html.append("⚠️ <strong>Note:</strong> Please bring your driver's license and arrive on time. ");
            html.append("If you need to change your appointment, please contact the assigned staff or the store at least 2 hours in advance.");
            html.append("</div>");

            html.append("<p style='color:#374151;font-size:13px;'>Best regards,<br><strong>MBServices Team</strong></p>");
            html.append("</div></div>");

            helper.setText(html.toString(), true);
            mailSender.send(message);
            log.info("Staff assignment email sent to {}", testRide.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to send staff assignment email to {}", testRide.getUser().getEmail(), e);
        }
    }

    @Async
    public void sendStaffAssignedServiceEmail(MaintenanceService service, Staff staff) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(service.getUser().getEmail());
            helper.setSubject("✅ Your service booking has been confirmed - MBServices");

            String staffName = (staff.getUser() != null)
                ? (staff.getUser().getFirstname() + " " + staff.getUser().getLastname()).trim()
                : "N/A";
            String staffPhone = (staff.getUser() != null && staff.getUser().getPhone() != null)
                ? staff.getUser().getPhone()
                : "Contact store";

            String scheduleStr = service.getScheduleDate() != null
                ? service.getScheduleDate().toString().replace("T", " ").substring(0, 16)
                : "N/A";

            String costStr = service.getCost() != null
                ? String.format("%,.0f VND", service.getCost())
                : "To be quoted after inspection";

            StringBuilder html = new StringBuilder();
            html.append("<div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;'>");
            html.append("<div style='background:#dc2626;padding:20px 24px;border-radius:10px 10px 0 0;'>");
            html.append("<h1 style='color:white;margin:0;font-size:20px;'>MBServices - Service Booking Confirmed</h1>");
            html.append("</div>");
            html.append("<div style='background:white;padding:24px;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;'>");
            html.append("<p style='color:#374151;'>Hello <strong>").append(service.getUser().getFirstname()).append("</strong>,</p>");
            html.append("<p style='color:#374151;'>Your service booking has been confirmed and a technician has been assigned.</p>");

            html.append("<div style='background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;'>");
            html.append("<h3 style='color:#111827;margin:0 0 12px;font-size:15px;'>🔧 Service Details</h3>");
            html.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
            if (service.getMotorcycle() != null) {
                html.append("<tr><td style='color:#6b7280;padding:4px 0;width:140px;'>Bike:</td><td style='color:#111827;font-weight:600;'>")
                    .append(service.getMotorcycle().getBrand()).append(" ").append(service.getMotorcycle().getModel()).append("</td></tr>");
            }
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Service Type:</td><td style='color:#111827;font-weight:600;'>")
                .append(service.getServiceType() != null ? service.getServiceType() : "General").append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Appointment Date:</td><td style='color:#111827;font-weight:600;'>").append(scheduleStr).append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Estimated Cost:</td><td style='color:#111827;font-weight:600;'>").append(costStr).append("</td></tr>");
            if (service.getStore() != null) {
                html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Store Branch:</td><td style='color:#111827;font-weight:600;'>")
                    .append(service.getStore().getName()).append(" — ").append(service.getStore().getAddress()).append("</td></tr>");
            }
            html.append("</table></div>");

            html.append("<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;'>");
            html.append("<h3 style='color:#1d4ed8;margin:0 0 12px;font-size:15px;'>👷 Assigned Technician</h3>");
            html.append("<table style='width:100%;border-collapse:collapse;font-size:14px;'>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;width:140px;'>Technician Name:</td><td style='color:#1e40af;font-weight:700;font-size:16px;'>").append(staffName).append("</td></tr>");
            html.append("<tr><td style='color:#6b7280;padding:4px 0;'>Phone Number:</td><td style='color:#1e40af;font-weight:700;font-size:16px;'>").append(staffPhone).append("</td></tr>");
            html.append("</table></div>");

            html.append("<div style='background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;color:#92400e;'>");
            html.append("⚠️ <strong>Note:</strong> Any deposit made will be deducted from the total service cost. ");
            html.append("If you do not proceed with the service, the deposit will be refunded when you visit the store in person.");
            html.append("</div>");

            html.append("<p style='color:#374151;font-size:13px;'>Best regards,<br><strong>MBServices Team</strong></p>");
            html.append("</div></div>");

            helper.setText(html.toString(), true);
            mailSender.send(message);
            log.info("Staff service assignment email sent to {}", service.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to send staff service assignment email to {}", service.getUser().getEmail(), e);
        }
    }
}