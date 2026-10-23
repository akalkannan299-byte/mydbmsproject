package com.noirbite.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record CreateOrderRequest(
    @NotBlank @Size(max=100) String customerName,
    @NotBlank @Pattern(regexp="[0-9+ -]{8,20}") String phone,
    @NotBlank @Pattern(regexp="DINE_IN|TAKEAWAY") String orderType,
    @Positive Integer tableNumber,
    @Size(max=500) String instructions,
    @NotEmpty List<@Valid Item> items
) {
    public record Item(@NotNull @Positive Long foodId, @Min(1) @Max(50) int quantity) {}
}
