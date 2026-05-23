package com.okane.settingsmanagement.repository;

import com.okane.settingsmanagement.entity.UserPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    Optional<UserPreference> findByUser_Id(Long userId);
}
