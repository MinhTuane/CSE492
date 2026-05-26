package com.capstone.mbservices.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class ForumPostRequest {
    @NotNull
    private String userId;
    @NotBlank
    private String title;
    @NotBlank
    private String content;
    @NotBlank
    private String category;

    public String getUserId() {
        return userId;
    }
    public String getTitle() {
        return title;
    }
    public String getContent() {
        return content;
    }
    public String getCategory() {
        return category;
    }
}
