package com.okane.customer.repository;

import com.okane.customer.entity.Customer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUser_Id(Long userId);

    /** Search clients by name, phone, or identity number (for sender search). */
    @Query("""
        SELECT c FROM Customer c JOIN FETCH c.user u
        WHERE LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(c.identityNumber) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
    """)
    List<Customer> searchByQuery(@Param("q") String query, Pageable pageable);

    Optional<Customer> findByIdentityTypeAndIdentityNumber(String identityType, String identityNumber);
}
