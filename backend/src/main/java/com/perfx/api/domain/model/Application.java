package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class Application {
    private UUID id;
    private UUID userId;
    private String name;
    private boolean favorite;
}
