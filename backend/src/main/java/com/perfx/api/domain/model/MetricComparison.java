package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MetricComparison {
    private String requestName;

    private double baseAvgResponseTime;
    private double targetAvgResponseTime;
    private double avgResponseTimeDiffPercent;

    private double baseThroughput;
    private double targetThroughput;
    private double throughputDiffPercent;

    private double baseErrorRate;
    private double targetErrorRate;
    private double errorRateDiffPercent;

    private double baseP98;
    private double targetP98;
    private double p98DiffPercent;
}
