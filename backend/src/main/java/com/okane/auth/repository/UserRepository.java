package com.okane.auth.repository;

import com.okane.auth.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole_NameOrderByCreatedAtDesc(String roleName);

    long countByRole_Name(String roleName);

    long countByEnabledTrueAndAccountSuspendedFalseAndAccountLockedFalse();

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
