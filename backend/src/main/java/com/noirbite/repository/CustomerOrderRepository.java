package com.noirbite.repository;

import com.noirbite.model.CustomerOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Every read loads the order items in the same query. open-in-view is disabled, so a lazily
 * loaded collection would otherwise throw LazyInitializationException when the controller
 * builds the response.
 */
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    @Override
    @EntityGraph(attributePaths = "items")
    Optional<CustomerOrder> findById(Long id);

    @EntityGraph(attributePaths = "items")
    List<CustomerOrder> findByPhoneOrderByCreatedAtDesc(String phone);

    @EntityGraph(attributePaths = "items")
    List<CustomerOrder> findAllByOrderByCreatedAtDesc();
}
