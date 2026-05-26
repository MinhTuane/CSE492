package com.capstone.mbservices.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.capstone.mbservices.entity.ForumPost;
import com.capstone.mbservices.entity.ForumComment;
import com.capstone.mbservices.service.ForumService;
import com.capstone.mbservices.dto.request.ForumPostRequest;
import com.capstone.mbservices.dto.request.ForumCommentRequest;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/forum")  // NO /api prefix!
@RequiredArgsConstructor
public class ForumController {
    private final ForumService forumService;

    @GetMapping("/posts")
    public ResponseEntity<Map<String, Object>> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean hot) {
        return ResponseEntity.ok(forumService.getPosts(category, search, hot, page, size));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ForumPost> getPostById(@PathVariable String id) {
        return ResponseEntity.ok(forumService.getPostById(id));
    }

    @PostMapping("/posts")
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ForumPost> createPost(@Valid @RequestBody ForumPostRequest request) {
        return ResponseEntity.ok(forumService.createPost(request));
    }

    @PostMapping("/posts/{id}/comments")
    @PreAuthorize("#request.userId == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ForumComment> addComment(
            @PathVariable String id,
            @Valid @RequestBody ForumCommentRequest request) {
        return ResponseEntity.ok(forumService.addComment(id, request));
    }
    
    @PutMapping("/comments/{id}")
    @PreAuthorize("#data.get('userId') == authentication.principal.id or hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ForumComment> updateComment(
            @PathVariable String id,
            @RequestBody Map<String, String> data) {
        String userId = data.get("userId");
        String content = data.get("content");
        return ResponseEntity.ok(forumService.updateComment(id, userId, content));
    }

    @PostMapping("/posts/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ForumPost> likePost(@PathVariable String id) {
        return ResponseEntity.ok(forumService.likePost(id));
    }

    @PostMapping("/posts/{id}/report")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ForumPost> reportPost(@PathVariable String id) {
        return ResponseEntity.ok(forumService.reportPost(id));
    }
}
