package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.Motorcycle;
import com.capstone.mbservices.repository.MotorcycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
public class MobileApiController {

    private final MotorcycleRepository motorcycleRepository;

    /**
     * Endpoint tối ưu cho Mobile App: Trả về danh sách xe rút gọn (chỉ lấy các field cần thiết)
     * giúp giảm băng thông và tăng tốc độ load trên thiết bị di động.
     */
    @GetMapping("/motorcycles/lite")
    public ResponseEntity<List<Map<String, Object>>> getMotorcyclesLite() {
        List<Motorcycle> motorcycles = motorcycleRepository.findAll();
        List<Map<String, Object>> liteList = motorcycles.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getBrand() + " " + m.getModel());
            map.put("price", m.getPrice());
            map.put("thumbnail", m.getImages() != null && !m.getImages().isEmpty() ? m.getImages().get(0) : null);
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(liteList);
    }
    
    /**
     * Endpoint mock để nhận Push Notification Token từ thiết bị di động (FCM/APNs)
     */
    @PostMapping("/users/device-token")
    public ResponseEntity<String> updateDeviceToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        // TODO: Lưu token này vào Entity User hoặc bảng DeviceToken để dùng cho Firebase Cloud Messaging sau này
        return ResponseEntity.ok("Device token updated successfully for push notifications");
    }
}