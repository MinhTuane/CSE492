package com.capstone.mbservices.dto.request;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotBlank(message = "User ID is required")
    private String userId;
    
    @NotBlank(message = "Motorcycle ID is required")
    private String motorcycleId;
    
    @NotNull(message = "Rating is required")
    @Min(1) @Max(5)
    private Integer rating;
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    private List<String> images;

    public String getUserId() {
        return userId;
    }
    public String getMotorcycleId() {
        return motorcycleId;
    }
    public Integer getRating() {
        return rating;
    }
    public String getTitle() {
        return title;
    }
    public String getContent() {
        return content;
    }
    public List<String> getImages() {
        return images;
    }
}
