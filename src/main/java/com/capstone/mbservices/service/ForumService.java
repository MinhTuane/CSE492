package com.capstone.mbservices.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.capstone.mbservices.entity.*;
import com.capstone.mbservices.repository.*;
import com.capstone.mbservices.exception.ResourceNotFoundException;
import com.capstone.mbservices.exception.BadRequestException;
import com.capstone.mbservices.dto.request.ForumPostRequest;
import com.capstone.mbservices.dto.request.ForumCommentRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ForumService {
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getPosts(String category, String search, Boolean hot, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createAt"));

        Page<ForumPost> postPage;
        if (hot != null && hot) {
            postPage = forumPostRepository.findByIsHotTrueAndIsHiddenFalse(pageable);
        } else if (search != null && !search.isBlank()) {
            postPage = forumPostRepository.findByTitleContainingIgnoreCaseAndIsHiddenFalse(search, pageable);
        } else if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
            postPage = forumPostRepository.findByCategoryAndIsHiddenFalse(category, pageable);
        } else {
            postPage = forumPostRepository.findByIsHiddenFalse(pageable);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", postPage.getContent());
        response.put("currentPage", postPage.getNumber());
        response.put("totalItems", postPage.getTotalElements());
        response.put("totalPages", postPage.getTotalPages());
        return response;
    }

    public ForumPost getPostById(String id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        List<ForumComment> comments = forumCommentRepository.findByPostIdAndIsHiddenFalseOrderByCreateAtDesc(id);
        post.setComments(comments);
        post.setCommentsCount(comments != null ? comments.size() : 0);
        return post;
    }

    public ForumPost createPost(ForumPostRequest request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ForumPost post = ForumPost.builder()
            .user(user)
            .title(request.getTitle())
            .content(request.getContent())
            .category(request.getCategory())
            .isHot(false)
            .isHidden(false)
            .likesCount(0)
            .reportsCount(0)
            .commentsCount(0)
            .build();
        return forumPostRepository.save(post);
    }

    public ForumComment addComment(String postId, ForumCommentRequest request) {
        ForumPost post = forumPostRepository.findById(postId)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ForumComment comment = ForumComment.builder()
            .post(post)
            .user(user)
            .content(request.getContent())
            .isHidden(false)
            .build();
        ForumComment saved = forumCommentRepository.save(comment);
        int count = forumCommentRepository.findByPostIdAndIsHiddenFalseOrderByCreateAtDesc(postId).size();
        post.setCommentsCount(count);
        forumPostRepository.save(post);
        return saved;
    }
    
    public ForumComment updateComment(String commentId, String userId, String content) {
        ForumComment comment = forumCommentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (userId == null || comment.getUser() == null || !comment.getUser().getId().equals(userId)) {
            throw new BadRequestException("You can only edit your own comment");
        }
        
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Content cannot be empty");
        }
        
        comment.setContent(content.trim());
        return forumCommentRepository.save(comment);
    }

    @Transactional
    public ForumPost likePost(String id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        post.setLikesCount((post.getLikesCount() == null ? 0 : post.getLikesCount()) + 1);
        return forumPostRepository.save(post);
    }

    @Transactional
    public ForumPost reportPost(String id) {
        ForumPost post = forumPostRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        post.setReportsCount((post.getReportsCount() == null ? 0 : post.getReportsCount()) + 1);
        return forumPostRepository.save(post);
    }
}
