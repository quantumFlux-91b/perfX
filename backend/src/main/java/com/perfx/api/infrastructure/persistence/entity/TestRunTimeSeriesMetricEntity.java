package com.perfx.api.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "test_run_time_series_metrics")
@Getter
@Setter
public class TestRunTimeSeriesMetricEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "test_run_id", insertable = false, updatable = false)
    private UUID testRunId;
    
    private int minuteOffset;
    private String requestName;
    private double avgResponseTime;
    private double percentile98;
    private double throughput;
    private double errorRate;
}
