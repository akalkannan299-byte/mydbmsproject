package com.noirbite;

import com.jayway.jsonpath.JsonPath;
import com.noirbite.model.FoodCategory;
import com.noirbite.model.FoodItem;
import com.noirbite.repository.FoodCategoryRepository;
import com.noirbite.repository.FoodItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderFlowTests {
    @Autowired MockMvc mvc;
    @Autowired FoodCategoryRepository categories;
    @Autowired FoodItemRepository foods;

    private Long teaId;
    private Long soldOutId;

    @BeforeEach
    void seed() {
        FoodCategory category = categories.save(new FoodCategory("Test-" + UUID.randomUUID(), "test"));
        teaId = saveFood("Tea", "20.00", true, category).getId();
        soldOutId = saveFood("Sold Out Soup", "99.00", false, category).getId();
    }

    private FoodItem saveFood(String name, String price, boolean available, FoodCategory category) {
        FoodItem f = new FoodItem();
        f.setName(name);
        f.setPrice(new BigDecimal(price));
        f.setAvailable(available);
        f.setCategory(category);
        return foods.save(f);
    }

    private String orderJson(Long foodId, int quantity) {
        return """
            {"customerName":"Demo Customer","phone":"9876543210","orderType":"TAKEAWAY",
             "items":[{"foodId":%d,"quantity":%d}]}""".formatted(foodId, quantity);
    }

    @Test
    void orderCanBeCreatedAndReadBackWithItems() throws Exception {
        String created = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(orderJson(teaId, 2)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.subtotal").value(40.0))
            .andExpect(jsonPath("$.tax").value(2.0))
            .andExpect(jsonPath("$.grandTotal").value(42.0))
            .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();

        // Regression: this used to fail with LazyInitializationException (open-in-view is off).
        mvc.perform(get("/api/orders/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].foodName").value("Tea"))
            .andExpect(jsonPath("$.items[0].quantity").value(2));

        mvc.perform(get("/api/orders/my-orders").param("phone", "9876543210"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].items[0].foodName").value("Tea"));
    }

    @Test
    void unavailableItemIsRejectedWithReadableMessage() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(orderJson(soldOutId, 1)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("unavailable")));
    }

    @Test
    void invalidOrderReturnsBadRequestWithMessage() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"customerName\":\"\",\"phone\":\"1\",\"orderType\":\"TAKEAWAY\",\"items\":[]}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void adminEndpointsRequireTheKeyAndStatusCanBeUpdated() throws Exception {
        mvc.perform(get("/api/admin/orders")).andExpect(status().isForbidden());

        String created = mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(orderJson(teaId, 1)))
            .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(created, "$.id")).longValue();

        mvc.perform(patch("/api/orders/" + id + "/status").contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"READY\"}"))
            .andExpect(status().isForbidden());

        mvc.perform(patch("/api/orders/" + id + "/status").header("X-Admin-Key", "test-key")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"READY\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("READY"))
            .andExpect(jsonPath("$.items[0].foodName").value("Tea"));

        mvc.perform(get("/api/admin/orders").header("X-Admin-Key", "test-key"))
            .andExpect(status().isOk());
    }

    @Test
    void assistantIsReportedDisabledWithoutAnApiKey() throws Exception {
        mvc.perform(get("/api/config"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assistantEnabled").value(false))
            .andExpect(jsonPath("$.taxRate").value(0.05));
        mvc.perform(post("/api/assistant/chat").contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"What is vegetarian?\"}"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.message").exists());
    }
}
