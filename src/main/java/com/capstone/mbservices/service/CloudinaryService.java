package com.capstone.mbservices.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.mbservices.exception.BadRequestException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CloudinaryService {
    
    private final Cloudinary cloudinary;
    
    /**
     * Upload single image to Cloudinary
     * @param file - The image file to upload
     * @param folder - Folder name in Cloudinary (e.g., "motorcycles", "reviews")
     * @return URL of uploaded image
     */
    public String uploadImage(MultipartFile file, String folder) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new BadRequestException("File is empty");
            }
            
            // Validate file type
            String contentType = file.getContentType();
            String originalName = file.getOriginalFilename();
            boolean imageByName = originalName != null && originalName.toLowerCase().matches(".*\\.(jpg|jpeg|png|gif|webp|bmp)$");
            boolean isImage = (contentType != null && contentType.startsWith("image/")) || imageByName;
            if (!isImage) {
                throw new BadRequestException("File must be an image");
            }
            
            // Validate file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new BadRequestException("File size must be less than 10MB");
            }
            
            // Generate unique filename
            String publicId = UUID.randomUUID().toString();
            
            // Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "resource_type", "image"
                )
            );
            
            // Return secure URL
            return (String) uploadResult.get("secure_url");
            
        } catch (Exception e) {
            throw new BadRequestException("Failed to upload image: " + e.getMessage());
        }
    }
    
    /**
     * Upload multiple images to Cloudinary
     * @param files - Array of image files
     * @param folder - Folder name in Cloudinary
     * @return List of URLs
     */
    public List<String> uploadMultipleImages(MultipartFile[] files, String folder) {
        List<String> imageUrls = new ArrayList<>();
        
        if (files == null || files.length == 0) {
            return imageUrls;
        }
        
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String url = uploadImage(file, folder);
                imageUrls.add(url);
            }
        }
        
        return imageUrls;
    }
    
    public String uploadUrl(String url, String folder) {
        try {
            Map uploadResult = cloudinary.uploader().upload(
                url,
                ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image"
                )
            );
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            throw new BadRequestException("Failed to upload image url: " + e.getMessage());
        }
    }
    
    public String uploadPlaceholder(String text, String folder) {
        try {
            String fallbackUrl = "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800";
            java.awt.image.BufferedImage base;
            try {
                java.net.URL u = new java.net.URL(fallbackUrl);
                base = javax.imageio.ImageIO.read(u);
            } catch (Exception ex) {
                int w0 = 640, h0 = 360;
                base = new java.awt.image.BufferedImage(w0, h0, java.awt.image.BufferedImage.TYPE_INT_RGB);
                java.awt.Graphics2D g0 = base.createGraphics();
                g0.setColor(java.awt.Color.DARK_GRAY);
                g0.fillRect(0, 0, w0, h0);
                g0.dispose();
            }
            int w = base.getWidth();
            int h = base.getHeight();
            java.awt.Graphics2D g = base.createGraphics();
            g.setColor(new java.awt.Color(0, 0, 0, 128));
            g.fillRect(0, Math.max(0, h - 60), w, 60);
            g.setColor(java.awt.Color.WHITE);
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.BOLD, 28));
            String s = text != null && !text.isBlank() ? text : "Motorcycle";
            java.awt.FontMetrics fm = g.getFontMetrics();
            int x = Math.max(16, (w - fm.stringWidth(s)) / 2);
            int y = Math.max(24, h - 20);
            g.drawString(s, x, y);
            g.dispose();
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(base, "jpg", baos);
            byte[] bytes = baos.toByteArray();
            return uploadBytes(bytes, folder);
        } catch (Exception e) {
            throw new BadRequestException("Failed to upload placeholder: " + e.getMessage());
        }
    }
    
    public String uploadBytes(byte[] bytes, String folder) {
        try {
            String publicId = UUID.randomUUID().toString();
            Map uploadResult = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "resource_type", "image"
                )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload image bytes: " + e.getMessage());
        }
    }
    
    /**
     * Delete image from Cloudinary
     * @param imageUrl - Full URL of the image
     */
    public void deleteImage(String imageUrl) {
        try {
            // Extract public_id from URL
            String publicId = extractPublicId(imageUrl);
            
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (Exception e) {
            // Log error but don't throw exception
            System.err.println("Failed to delete image: " + e.getMessage());
        }
    }
    
    /**
     * Delete multiple images from Cloudinary
     * @param imageUrls - List of image URLs
     */
    public void deleteMultipleImages(List<String> imageUrls) {
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (String url : imageUrls) {
                deleteImage(url);
            }
        }
    }
    
    /**
     * Extract public_id from Cloudinary URL
     * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/motorcycles/abc123.jpg
     * Returns: motorcycles/abc123
     */
    private String extractPublicId(String imageUrl) {
        try {
            if (imageUrl == null || !imageUrl.contains("cloudinary.com")) {
                return null;
            }
            
            String[] parts = imageUrl.split("/upload/");
            if (parts.length < 2) {
                return null;
            }
            
            String afterUpload = parts[1];
            String[] pathParts = afterUpload.split("/");
            
            // Skip version (v1234567890) if present
            int startIndex = pathParts[0].startsWith("v") ? 1 : 0;
            
            StringBuilder publicId = new StringBuilder();
            for (int i = startIndex; i < pathParts.length; i++) {
                if (i > startIndex) {
                    publicId.append("/");
                }
                publicId.append(pathParts[i]);
            }
            
            // Remove file extension
            String result = publicId.toString();
            int lastDot = result.lastIndexOf('.');
            if (lastDot > 0) {
                result = result.substring(0, lastDot);
            }
            
            return result;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Upload an image with a deterministic public ID (overwrites existing with the same ID).
     */
    public String uploadBytesWithPublicId(byte[] bytes, String folder, String publicId) {
        try {
            Map uploadResult = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "overwrite", true,
                    "resource_type", "image"
                )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload image with custom public ID: " + e.getMessage());
        }
    }

    /**
     * Upload a remote URL with a deterministic public ID (overwrites existing with the same ID).
     */
    public String uploadUrlWithPublicId(String url, String folder, String publicId) {
        try {
            Map uploadResult = cloudinary.uploader().upload(
                url,
                ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "overwrite", true,
                    "resource_type", "image"
                )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload url with custom public ID: " + e.getMessage());
        }
    }
}
