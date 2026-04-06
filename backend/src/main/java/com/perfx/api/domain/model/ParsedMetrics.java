package com.perfx.api.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ParsedMetrics {
    private List<TestMetric> aggregateMetrics;
    private List<TestRunTimeSeriesMetric> timeSeriesMetrics;
}
