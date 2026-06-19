package com.capstone.mbservices.controller;

import com.capstone.mbservices.dto.request.DiscountCodeRequest;
import com.capstone.mbservices.entity.DiscountCode;
import com.capstone.mbservices.service.DiscountCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discount-codes")
@RequiredArgsConstructor
public class DiscountCodeController {

    private final DiscountCodeService discountCodeService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DiscountCode>> getAll() {
        return ResponseEntity.ok(discountCodeService.getAllDiscountCodes());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCode> create(@RequestBody DiscountCodeRequest request) {
        return ResponseEntity.ok(discountCodeService.createDiscountCode(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DiscountCode> update(@PathVariable String id, @RequestBody DiscountCodeRequest request) {
        return ResponseEntity.ok(discountCodeService.updateDiscountCode(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        discountCodeService.deleteDiscountCode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<DiscountCode> validate(@PathVariable String code) {
        return ResponseEntity.ok(discountCodeService.validateDiscountCode(code));
    }
}
