package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.ForumComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, String> {
    List<ForumComment> findByPostIdAndIsHiddenFalseOrderByCreateAtDesc(String postId);
    void deleteByPostId(String postId);
    Page<ForumComment> findByPostId(String postId, Pageable pageable);
}
