package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class User {
    private UUID id;
    private String email;
    private String passwordHash;
    private String firstName;
    private String lastName;
    private String profilePictureUrl;
}
