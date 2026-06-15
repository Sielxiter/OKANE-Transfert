package com.okane.notification.repository;

import com.okane.notification.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {
    Page<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findTop5ByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_IdAndStatusIgnoreCase(Long userId, String status);

    Optional<Notification> findByIdAndUser_Id(Long id, Long userId);

    void deleteByIdAndUser_Id(Long id, Long userId);
}
