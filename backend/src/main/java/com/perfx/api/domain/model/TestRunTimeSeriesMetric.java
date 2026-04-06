package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TestRunTimeSeriesMetric {
    private UUID id;
    private UUID testRunId;
    private int minuteOffset;
    private String requestName;
    private double avgResponseTime;
    private double percentile98;
    private double throughput;
    private double errorRate;
}
