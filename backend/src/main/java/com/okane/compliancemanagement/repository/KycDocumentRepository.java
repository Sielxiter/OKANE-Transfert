package com.okane.compliancemanagement.repository;

import com.okane.compliance.entity.KycDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {

    List<KycDocument> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);
}
