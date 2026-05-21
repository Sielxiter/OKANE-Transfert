package com.okane.customer.repository;

import com.okane.customer.entity.Customer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByUser_Id(Long userId);
}
