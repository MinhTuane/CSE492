package com.capstone.mbservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForumCommentRequest {
    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Content is required")
    private String content;
}

