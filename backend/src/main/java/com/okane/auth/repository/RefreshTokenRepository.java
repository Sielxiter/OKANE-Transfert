package com.okane.auth.repository;

import com.okane.auth.entity.RefreshToken;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUser_IdAndRevokedFalse(Long userId);

    @Modifying
    @Query("update RefreshToken rt set rt.revoked = true where rt.token = :token")
    int revokeByToken(@Param("token") String token);

    @Modifying
    @Query("update RefreshToken rt set rt.revoked = true where rt.user.id = :userId and rt.revoked = false")
    int revokeAllActiveByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from RefreshToken rt where rt.expiryDate < :cutoff")
    int deleteExpired(@Param("cutoff") LocalDateTime cutoff);
}
