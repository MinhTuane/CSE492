package com.capstone.mbservices.service;

import com.capstone.mbservices.dto.request.DiscountCodeRequest;
import com.capstone.mbservices.entity.DiscountCode;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.repository.DiscountCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountCodeService {
    private final DiscountCodeRepository discountCodeRepository;

    public List<DiscountCode> getAllDiscountCodes() {
        return discountCodeRepository.findAll();
    }

    @Transactional
    public DiscountCode createDiscountCode(DiscountCodeRequest request) {
        if (discountCodeRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Discount code already exists");
        }
        DiscountCode code = DiscountCode.builder()
                .code(request.getCode().toUpperCase())
                .discountPercentage(request.getDiscountPercentage())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .maxUsages(request.getMaxUsages())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .currentUsages(0)
                .build();
        return discountCodeRepository.save(code);
    }

    @Transactional
    public DiscountCode updateDiscountCode(String id, DiscountCodeRequest request) {
        DiscountCode code = discountCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discount code not found"));
                
        if (!code.getCode().equals(request.getCode().toUpperCase()) && 
            discountCodeRepository.findByCode(request.getCode().toUpperCase()).isPresent()) {
            throw new BadRequestException("Discount code already exists");
        }

        code.setCode(request.getCode().toUpperCase());
        code.setDiscountPercentage(request.getDiscountPercentage());
        code.setMaxDiscountAmount(request.getMaxDiscountAmount());
        code.setValidFrom(request.getValidFrom());
        code.setValidTo(request.getValidTo());
        code.setMaxUsages(request.getMaxUsages());
        if (request.getIsActive() != null) {
            code.setIsActive(request.getIsActive());
        }

        return discountCodeRepository.save(code);
    }

    @Transactional
    public void deleteDiscountCode(String id) {
        discountCodeRepository.deleteById(id);
    }

    @Transactional
    public DiscountCode validateDiscountCode(String codeStr) {
        // Use pessimistic locking to prevent race conditions
        String normalized = codeStr != null ? codeStr.trim().toUpperCase() : "";
        DiscountCode code = discountCodeRepository.findByCodeForUpdate(normalized)
                .orElseThrow(() -> new BadRequestException("Invalid discount code"));

        if (!code.getIsActive()) {
            throw new BadRequestException("Discount code is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (code.getValidFrom() != null && now.isBefore(code.getValidFrom())) {
            throw new BadRequestException("Discount code is not yet valid");
        }
        if (code.getValidTo() != null && now.isAfter(code.getValidTo())) {
            throw new BadRequestException("Discount code has expired");
        }

        if (code.getMaxUsages() != null && code.getCurrentUsages() >= code.getMaxUsages()) {
            throw new BadRequestException("Discount code usage limit reached");
        }

        return code;
    }

    @Transactional
    public DiscountCode consumeDiscountCode(String codeStr) {
        String normalized = codeStr != null ? codeStr.trim().toUpperCase() : "";
        DiscountCode code = discountCodeRepository.findByCodeForUpdate(normalized)
                .orElseThrow(() -> new BadRequestException("Invalid discount code"));

        if (!code.getIsActive()) {
            throw new BadRequestException("Discount code is not active");
        }
        LocalDateTime now = LocalDateTime.now();
        if (code.getValidFrom() != null && now.isBefore(code.getValidFrom())) {
            throw new BadRequestException("Discount code is not yet valid");
        }
        if (code.getValidTo() != null && now.isAfter(code.getValidTo())) {
            throw new BadRequestException("Discount code has expired");
        }
        if (code.getMaxUsages() != null && code.getCurrentUsages() != null && code.getCurrentUsages() >= code.getMaxUsages()) {
            throw new BadRequestException("Discount code usage limit reached");
        }

        code.setCurrentUsages((code.getCurrentUsages() != null ? code.getCurrentUsages() : 0) + 1);
        return discountCodeRepository.save(code);
    }
}
