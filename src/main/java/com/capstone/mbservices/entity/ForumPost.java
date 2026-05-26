package com.capstone.mbservices.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumPost {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000, nullable = false)
    private String content;

    @Column(nullable = false)
    private String category;

    private Boolean isHot = false;
    private Boolean isHidden = false;

    private Integer likesCount = 0;
    private Integer reportsCount = 0;
    private Integer commentsCount = 0;

    // Marketplace fields
    private Double price;
    private Boolean isVerifiedByShop;
    
    @CreationTimestamp
    private LocalDateTime createAt;

    @UpdateTimestamp
    private LocalDateTime updateAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ForumComment> comments;

    public void setComments(List<ForumComment> comments) {
        this.comments = comments;
    }

    public void setCommentsCount(Integer commentsCount) {
        this.commentsCount = commentsCount;
    }

    public static class Builder {
        private User user;
        private String title;
        private String content;
        private String category;
        private Boolean isHot;
        private Boolean isHidden;
        private Integer likesCount;
        private Integer reportsCount;
        private Integer commentsCount;
        private Double price;
        private Boolean isVerifiedByShop;
        private LocalDateTime createAt;

        public Builder user(User user) { this.user = user; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Builder category(String category) { this.category = category; return this; }
        public Builder isHot(Boolean isHot) { this.isHot = isHot; return this; }
        public Builder isHidden(Boolean isHidden) { this.isHidden = isHidden; return this; }
        public Builder likesCount(Integer likesCount) { this.likesCount = likesCount; return this; }
        public Builder reportsCount(Integer reportsCount) { this.reportsCount = reportsCount; return this; }
        public Builder commentsCount(Integer commentsCount) { this.commentsCount = commentsCount; return this; }
        public Builder price(Double price) { this.price = price; return this; }
        public Builder isVerifiedByShop(Boolean isVerifiedByShop) { this.isVerifiedByShop = isVerifiedByShop; return this; }
        public Builder createAt(LocalDateTime createAt) { this.createAt = createAt; return this; }

        public ForumPost build() {
            ForumPost fp = new ForumPost();
            fp.user = this.user;
            fp.title = this.title;
            fp.content = this.content;
            fp.category = this.category;
            fp.isHot = this.isHot != null ? this.isHot : Boolean.FALSE;
            fp.isHidden = this.isHidden != null ? this.isHidden : Boolean.FALSE;
            fp.likesCount = this.likesCount != null ? this.likesCount : 0;
            fp.reportsCount = this.reportsCount != null ? this.reportsCount : 0;
            fp.commentsCount = this.commentsCount != null ? this.commentsCount : 0;
            fp.price = this.price;
            fp.isVerifiedByShop = this.isVerifiedByShop;
            fp.createAt = this.createAt;
            return fp;
        }
    }

    public static Builder builder() {
        return new Builder();
    }
}
