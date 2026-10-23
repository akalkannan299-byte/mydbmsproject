package com.noirbite.repository;
import com.noirbite.model.FoodCategory;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FoodCategoryRepository extends JpaRepository<FoodCategory, Long> {}
