package com.noirbite.assistant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AssistantRequest(
    @NotBlank @Size(max = 500) String message,
    @Size(max = 6) List<@Valid Turn> history
) {
    /** One earlier message in the conversation. role is "user" or "model". */
    public record Turn(
        @NotBlank @Pattern(regexp = "user|model") String role,
        @NotBlank @Size(max = 1000) String text
    ) {}
}
