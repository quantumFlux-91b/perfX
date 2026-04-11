package com.perfx.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter
@Setter
public class ApplicationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID userId;
    
    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean favorite = false;
}
