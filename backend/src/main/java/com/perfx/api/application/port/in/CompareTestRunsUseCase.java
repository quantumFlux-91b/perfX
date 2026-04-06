package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.MetricComparison;
import java.util.List;
import java.util.UUID;

public interface CompareTestRunsUseCase {
    List<MetricComparison> compare(UUID baseRunId, UUID targetRunId);
}
