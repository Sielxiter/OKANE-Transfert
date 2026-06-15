package com.okane.managermodule.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.agency.repository.AgencyUserRepository;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.managermodule.dto.ManagerProfileDto;
import com.okane.managermodule.exception.ManagerNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ManagerProfileService {

    private final UserRepository userRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final AgencyRepository agencyRepository;
    private final AgencyUserRepository agencyUserRepository;
    private final PasswordEncoder passwordEncoder;

    public ManagerProfileService(UserRepository userRepository,
                                  CentralAgencyRepository centralAgencyRepository,
                                  AgencyRepository agencyRepository,
                                  AgencyUserRepository agencyUserRepository,
                                  PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.agencyRepository = agencyRepository;
        this.agencyUserRepository = agencyUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ManagerProfileDto getProfile(Authentication authentication) {
        String email = authentication.getName();
        User manager = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ManagerNotFoundException("Manager not found: " + email));

        CentralAgency centralAgency = centralAgencyRepository.findByManager_Id(manager.getId()).orElse(null);
        
        // Count sub-agencies via AgencyRepository (centralAgency doesn't have getSubAgencies())
        long subAgencyCount = 0;
        long totalAgentCount = 0;
        if (centralAgency != null) {
            List<Agency> subAgencies = agencyRepository.findByCentralAgency_IdOrderByCreatedAtDesc(centralAgency.getId());
            subAgencyCount = subAgencies.size();
            
            for (Agency agency : subAgencies) {
                totalAgentCount += agencyUserRepository.countByAgency_IdAndUser_Role_NameAndActiveTrue(agency.getId(), "ROLE_AGENT");
            }
        }

        return new ManagerProfileDto(
                manager.getId(),
                manager.getFirstName(),
                manager.getLastName(),
                manager.getFirstName() + " " + manager.getLastName(),
                manager.getEmail(),
                manager.getPhone(),
                manager.getRole() != null ? manager.getRole().getName() : "ROLE_MANAGER",
                centralAgency != null ? centralAgency.getName() : null,
                centralAgency != null ? centralAgency.getCode() : null,
                centralAgency != null ? centralAgency.getId() : null,
                subAgencyCount,
                totalAgentCount,
                manager.getLastLoginAt(),
                manager.getCreatedAt()
        );
    }

    @Transactional
    public void updateProfile(String firstName, String lastName, String phone, Authentication authentication) {
        String email = authentication.getName();
        User manager = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ManagerNotFoundException("Manager not found: " + email));
        manager.setFirstName(firstName);
        manager.setLastName(lastName);
        manager.setPhone(phone);
        userRepository.save(manager);
    }

    @Transactional
    public void changePassword(String currentPassword, String newPassword, Authentication authentication) {
        String email = authentication.getName();
        User manager = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ManagerNotFoundException("Manager not found: " + email));

        if (!passwordEncoder.matches(currentPassword, manager.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        manager.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(manager);
    }
}
