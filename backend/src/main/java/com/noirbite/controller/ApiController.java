package com.noirbite.controller;

import com.noirbite.assistant.AssistantRequest;
import com.noirbite.assistant.AssistantService;
import com.noirbite.dto.CreateOrderRequest;
import com.noirbite.model.*;
import com.noirbite.repository.*;
import com.noirbite.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final FoodItemRepository foods;
    private final FoodCategoryRepository categories;
    private final CustomerOrderRepository orders;
    private final OrderService orderService;
    private final AssistantService assistant;
    private final String taxRate;

    public ApiController(FoodItemRepository foods, FoodCategoryRepository categories,
                         CustomerOrderRepository orders, OrderService orderService,
                         AssistantService assistant, @Value("${app.tax-rate:0.05}") String taxRate) {
        this.foods = foods; this.categories = categories; this.orders = orders;
        this.orderService = orderService; this.assistant = assistant; this.taxRate = taxRate;
    }

    /** Public settings the UI needs: the tax rate for estimates and whether the AI concierge is on. */
    @GetMapping("/config")
    public Map<String, Object> config() {
        return Map.of("taxRate", new java.math.BigDecimal(taxRate), "assistantEnabled", assistant.isEnabled());
    }

    @PostMapping("/assistant/chat")
    public Map<String, String> chat(@Valid @RequestBody AssistantRequest request, HttpServletRequest http) {
        String realIp = http.getHeader("X-Real-IP"); // set by nginx; falls back to the socket address
        String client = (realIp != null && !realIp.isBlank()) ? realIp : http.getRemoteAddr();
        return Map.of("reply", assistant.chat(client, request));
    }

    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "ok", "application", "NoirBite"); }

    @GetMapping("/categories")
    public List<FoodCategory> categories() { return categories.findAll(); }

    @GetMapping("/foods")
    public List<FoodItem> foods() { return foods.findAll(); }

    @GetMapping("/foods/{id}")
    public FoodItem food(@PathVariable Long id) {
        return foods.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
    }

    @GetMapping("/foods/category/{categoryId}")
    public List<FoodItem> byCategory(@PathVariable Long categoryId) {
        return foods.findByCategoryIdAndAvailableTrueOrderByNameAsc(categoryId);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        CustomerOrder order = orderService.create(request);
        return orderResponse(order);
    }

    @GetMapping("/orders/{id}")
    public Map<String, Object> getOrder(@PathVariable Long id) {
        CustomerOrder order = orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        return orderResponse(order);
    }

    // Development convenience only. Replace with authenticated ownership checks before deployment.
    @GetMapping("/orders/my-orders")
    public List<Map<String, Object>> myOrders(@RequestParam String phone) {
        return orders.findByPhoneOrderByCreatedAtDesc(phone.trim()).stream().map(this::orderResponse).toList();
    }

    // Protected by AdminKeyFilter (X-Admin-Key header).
    @GetMapping("/admin/orders")
    public List<Map<String, Object>> adminOrders() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(this::orderResponse).toList();
    }

    @PatchMapping("/orders/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Set<String> valid = Set.of("PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED");
        String status = String.valueOf(body.getOrDefault("status", "")).toUpperCase(Locale.ROOT);
        if (!valid.contains(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
        return orderResponse(orderService.updateStatus(id, status));
    }

    @PostMapping("/foods")
    @ResponseStatus(HttpStatus.CREATED)
    public FoodItem addFood(@RequestBody Map<String, Object> body) {
        FoodItem food = new FoodItem();
        applyFood(food, body);
        return foods.save(food);
    }

    @PutMapping("/foods/{id}")
    public FoodItem updateFood(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FoodItem food = foods.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
        applyFood(food, body);
        return foods.save(food);
    }

    @DeleteMapping("/foods/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFood(@PathVariable Long id) {
        FoodItem food = foods.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food not found"));
        food.setAvailable(false); foods.save(food); // soft-disable to preserve order history
    }

    private void applyFood(FoodItem food, Map<String, Object> body) {
        try {
            food.setName(Objects.toString(body.get("name"), "").trim());
            if (food.getName().isBlank()) throw new IllegalArgumentException("Food name is required");
            food.setDescription(Objects.toString(body.get("description"), ""));
            food.setImageUrl(Objects.toString(body.get("imageUrl"), ""));
            food.setPrice(new java.math.BigDecimal(Objects.toString(body.get("price"), "0")));
            if (food.getPrice().signum() <= 0) throw new IllegalArgumentException("Price must be positive");
            food.setVegetarian(Boolean.parseBoolean(Objects.toString(body.get("vegetarian"), "true")));
            food.setAvailable(Boolean.parseBoolean(Objects.toString(body.get("available"), "true")));
            food.setDailySpecial(Boolean.parseBoolean(Objects.toString(body.get("dailySpecial"), "false")));
            Long categoryId = Long.valueOf(Objects.toString(body.get("categoryId"), "0"));
            food.setCategory(categories.findById(categoryId).orElseThrow(() -> new IllegalArgumentException("Invalid categoryId")));
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private Map<String, Object> orderResponse(CustomerOrder o) {
        List<Map<String, Object>> items = o.getItems().stream().map(i -> Map.<String, Object>of(
            "foodId", i.getFood().getId(), "foodName", i.getFood().getName(),
            "quantity", i.getQuantity(), "unitPrice", i.getUnitPrice(), "lineTotal", i.getLineTotal()
        )).toList();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", o.getId()); out.put("orderNumber", o.getOrderNumber());
        out.put("customerName", o.getCustomerName()); out.put("phone", o.getPhone());
        out.put("orderType", o.getOrderType()); out.put("tableNumber", o.getTableNumber());
        out.put("instructions", o.getInstructions()); out.put("status", o.getStatus());
        out.put("subtotal", o.getSubtotal()); out.put("tax", o.getTax());
        out.put("discount", o.getDiscount()); out.put("grandTotal", o.getGrandTotal());
        out.put("createdAt", o.getCreatedAt()); out.put("items", items);
        return out;
    }
}
