package com.okane.managermodule.service;

import com.okane.agency.entity.Agency;
import com.okane.agency.repository.AgencyRepository;
import com.okane.auth.entity.User;
import com.okane.auth.repository.UserRepository;
import com.okane.centralagency.entity.CentralAgency;
import com.okane.centralagency.repository.CentralAgencyRepository;
import com.okane.managermodule.exception.ManagerAccessDeniedException;
import com.okane.managermodule.exception.ManagerNotFoundException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ManagerScopeResolver {

    private final UserRepository userRepository;
    private final CentralAgencyRepository centralAgencyRepository;
    private final AgencyRepository agencyRepository;

    public ManagerScopeResolver(UserRepository userRepository,
                                CentralAgencyRepository centralAgencyRepository,
                                AgencyRepository agencyRepository) {
        this.userRepository = userRepository;
        this.centralAgencyRepository = centralAgencyRepository;
        this.agencyRepository = agencyRepository;
    }

    public ManagerScope resolve(String managerEmail) {
        User manager = userRepository.findByEmailIgnoreCase(managerEmail)
                .orElseThrow(() -> new ManagerNotFoundException("Manager not found: " + managerEmail));

        CentralAgency centralAgency = centralAgencyRepository.findByManager_Id(manager.getId())
                .orElseThrow(() -> new ManagerAccessDeniedException("No central agency assigned to manager: " + managerEmail));

        List<Long> subAgencyIds = agencyRepository
                .findByCentralAgency_IdOrderByCreatedAtDesc(centralAgency.getId())
                .stream()
                .map(Agency::getId)
                .toList();

        return new ManagerScope(manager.getId(), centralAgency.getId(), subAgencyIds, managerEmail);
    }
}
