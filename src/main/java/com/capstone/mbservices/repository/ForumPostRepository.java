package com.capstone.mbservices.repository;

import com.capstone.mbservices.entity.ForumPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, String> {
    Page<ForumPost> findByIsHiddenFalse(Pageable pageable);
    Page<ForumPost> findByCategoryAndIsHiddenFalse(String category, Pageable pageable);
    Page<ForumPost> findByTitleContainingIgnoreCaseAndIsHiddenFalse(String title, Pageable pageable);

    Page<ForumPost> findByIsHidden(Boolean hidden, Pageable pageable);
    Page<ForumPost> findByCategoryAndIsHidden(String category, Boolean hidden, Pageable pageable);
    Page<ForumPost> findByTitleContainingIgnoreCaseAndIsHidden(String title, Boolean hidden, Pageable pageable);

    Page<ForumPost> findByIsHotTrueAndIsHiddenFalse(Pageable pageable);
}

