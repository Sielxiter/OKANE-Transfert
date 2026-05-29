package com.okane.customer.repository;

import com.okane.customer.entity.Customer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUser_Id(Long userId);

    @Query("SELECT c FROM Customer c JOIN FETCH c.user WHERE c.id = :id")
    Optional<Customer> findByIdWithUser(@Param("id") Long id);

    boolean existsByIdentityTypeAndIdentityNumber(String identityType, String identityNumber);

    Optional<Customer> findByUser_Phone(String phone);

    List<Customer> findByUser_EnabledTrue();
}
