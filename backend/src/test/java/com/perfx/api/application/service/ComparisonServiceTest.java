package com.perfx.api.application.service;

import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.exception.TestRunNotFoundException;
import com.perfx.api.domain.model.MetricComparison;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ComparisonServiceTest {

    private TestRunRepository testRunRepository;
    private ComparisonService comparisonService;

    @BeforeEach
    void setUp() {
        testRunRepository = mock(TestRunRepository.class);
        comparisonService = new ComparisonService(testRunRepository);
    }

    @Test
    @DisplayName("compare() computes correct percentage differences")
    void compareComputes() {
        UUID baseId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        TestRun baseRun = createTestRun(baseId, List.of(
                createMetric("Login", 100.0, 10.0, 0.01, 150.0),
                createMetric("Search", 200.0, 20.0, 0.05, 300.0)
        ));

        TestRun targetRun = createTestRun(targetId, List.of(
                createMetric("Login", 120.0, 12.0, 0.02, 180.0),
                createMetric("Search", 180.0, 25.0, 0.03, 270.0)
        ));

        when(testRunRepository.findById(baseId)).thenReturn(Optional.of(baseRun));
        when(testRunRepository.findById(targetId)).thenReturn(Optional.of(targetRun));

        List<MetricComparison> result = comparisonService.compare(baseId, targetId);

        assertEquals(2, result.size());

        // Login: avgRT 100 -> 120 = +20%
        MetricComparison login = result.stream()
                .filter(c -> "Login".equals(c.getRequestName())).findFirst().orElseThrow();
        assertEquals(20.0, login.getAvgResponseTimeDiffPercent(), 0.1);
        assertEquals(20.0, login.getThroughputDiffPercent(), 0.1);
        assertEquals(100.0, login.getErrorRateDiffPercent(), 0.1); // 0.01 -> 0.02 = +100%
        assertEquals(20.0, login.getP98DiffPercent(), 0.1); // 150 -> 180 = +20%

        // Search: avgRT 200 -> 180 = -10%
        MetricComparison search = result.stream()
                .filter(c -> "Search".equals(c.getRequestName())).findFirst().orElseThrow();
        assertEquals(-10.0, search.getAvgResponseTimeDiffPercent(), 0.1);
        assertEquals(25.0, search.getThroughputDiffPercent(), 0.1);
        assertEquals(-10.0, search.getP98DiffPercent(), 0.1); // 300 -> 270 = -10%
    }

    @Test
    @DisplayName("compare() throws TestRunNotFoundException for missing base run")
    void compareThrowsOnMissingBaseRun() {
        UUID baseId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        when(testRunRepository.findById(baseId)).thenReturn(Optional.empty());

        assertThrows(TestRunNotFoundException.class, () -> comparisonService.compare(baseId, targetId));
    }

    @Test
    @DisplayName("compare() skips metrics without matching request names")
    void compareSkipsUnmatchedRequests() {
        UUID baseId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        TestRun baseRun = createTestRun(baseId, List.of(createMetric("Login", 100.0, 10.0, 0.0, 150.0)));
        TestRun targetRun = createTestRun(targetId, List.of(createMetric("Checkout", 200.0, 5.0, 0.0, 300.0)));

        when(testRunRepository.findById(baseId)).thenReturn(Optional.of(baseRun));
        when(testRunRepository.findById(targetId)).thenReturn(Optional.of(targetRun));

        List<MetricComparison> result = comparisonService.compare(baseId, targetId);

        assertTrue(result.isEmpty());
    }

    private TestRun createTestRun(UUID id, List<TestMetric> metrics) {
        return TestRun.builder()
                .id(id)
                .userId(UUID.randomUUID())
                .applicationName("TestApp")
                .applicationVersion("1.0")
                .runId("run-1")
                .uploadTimestamp(Instant.now())
                .metrics(metrics)
                .timeSeriesMetrics(List.of())
                .build();
    }

    private TestMetric createMetric(String name, double avgRt, double throughput, double errorRate, double p98) {
        return TestMetric.builder()
                .id(UUID.randomUUID())
                .requestName(name)
                .avgResponseTime(avgRt)
                .throughput(throughput)
                .errorRate(errorRate)
                .percentile98(p98)
                .percentile90(avgRt * 1.2)
                .percentile95(avgRt * 1.4)
                .build();
    }
}
