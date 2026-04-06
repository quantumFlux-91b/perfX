package com.perfx.api.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "test_metrics")
@Getter
@Setter
public class TestMetricEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "test_run_id", insertable = false, updatable = false)
    private UUID testRunId;
    
    private String requestName;
    private double avgResponseTime;
    private double percentile90;
    private double percentile95;
    private double percentile98;
    private double throughput;
    private double errorRate;
    private String errorCode;
}
