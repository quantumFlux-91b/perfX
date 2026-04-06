package com.perfx.api.domain.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TestRun {
    private UUID id;
    private UUID userId;
    private String applicationName;
    private String applicationVersion;
    private String runId;
    private Instant uploadTimestamp;
    private List<TestMetric> metrics;
}
