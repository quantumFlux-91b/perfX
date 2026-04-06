package com.perfx.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "test_runs")
@Getter
@Setter
public class TestRunEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID userId;
    
    private String applicationName;
    private String applicationVersion;
    private String runId;
    
    private Instant uploadTimestamp;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "test_run_id", nullable = false)
    private List<TestMetricEntity> metrics;
}
