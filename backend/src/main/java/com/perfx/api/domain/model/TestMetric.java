package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TestMetric {
    private UUID id;
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
