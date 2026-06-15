package com.okane.transfer.repository;

import com.okane.transfer.entity.TransferBeneficiary;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferBeneficiaryRepository extends JpaRepository<TransferBeneficiary, Long> {
}
