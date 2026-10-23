package com.noirbite.service;

import com.noirbite.dto.CreateOrderRequest;
import com.noirbite.model.*;
import com.noirbite.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class OrderService {
    private final CustomerOrderRepository orders;
    private final FoodItemRepository foods;
    @Value("${app.tax-rate:0.05}") private BigDecimal taxRate;

    public OrderService(CustomerOrderRepository orders, FoodItemRepository foods) {
        this.orders = orders; this.foods = foods;
    }

    @Transactional
    public CustomerOrder create(CreateOrderRequest request) {
        if ("DINE_IN".equals(request.orderType()) && request.tableNumber() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Table number is required for dine-in orders");
        CustomerOrder order = new CustomerOrder();
        order.setOrderNumber("NB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setCustomerName(request.customerName().trim());
        order.setPhone(request.phone().trim());
        order.setOrderType(request.orderType());
        order.setTableNumber(request.tableNumber());
        order.setInstructions(request.instructions());
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CreateOrderRequest.Item requested : request.items()) {
            FoodItem food = foods.findById(requested.foodId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Food item not found: " + requested.foodId()));
            if (!food.isAvailable()) throw new ResponseStatusException(HttpStatus.CONFLICT, food.getName() + " is unavailable");
            if (requested.quantity() < 1 || requested.quantity() > 50)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be between 1 and 50");
            BigDecimal line = food.getPrice().multiply(BigDecimal.valueOf(requested.quantity())).setScale(2, RoundingMode.HALF_UP);
            OrderItem item = new OrderItem();
            item.setFood(food); item.setQuantity(requested.quantity());
            item.setUnitPrice(food.getPrice()); item.setLineTotal(line);
            order.addItem(item);
            subtotal = subtotal.add(line);
        }
        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setTax(tax);
        order.setDiscount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        order.setGrandTotal(subtotal.add(tax).setScale(2, RoundingMode.HALF_UP));
        return orders.save(order);
    }

    @Transactional
    public CustomerOrder updateStatus(Long id, String status) {
        CustomerOrder order = orders.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setStatus(status);
        return order; // managed entity: the change is flushed when the transaction commits
    }
}
