package com.perfx.api.infrastructure.persistence.adapter;

import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRun;
import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ComponentScan(
    basePackages = {
        "com.perfx.api.infrastructure.persistence"
    },
    includeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = {TestRunPersistenceAdapter.class}
    )
)
class TestRunPersistenceAdapterIntegrationTest {

    @Autowired
    private TestRunPersistenceAdapter adapter;

    @Test
    @DisplayName("save() and findById() round-trip preserves all fields")
    void saveAndFindRoundTrip() {
        UUID userId = UUID.randomUUID();

        TestMetric metric = TestMetric.builder()
                .requestName("Login")
                .avgResponseTime(120.5)
                .percentile90(150.0)
                .percentile95(170.0)
                .percentile98(200.0)
                .throughput(45.3)
                .errorRate(0.02)
                .errorCode("500")
                .build();

        TestRunTimeSeriesMetric tsMetric = TestRunTimeSeriesMetric.builder()
                .minuteOffset(0)
                .requestName("Login")
                .avgResponseTime(115.0)
                .percentile98(195.0)
                .throughput(40.0)
                .errorRate(0.01)
                .build();

        TestRun testRun = TestRun.builder()
                .userId(userId)
                .applicationName("MyApp")
                .applicationVersion("2.0.1")
                .runId("run-integration-test")
                .uploadTimestamp(Instant.parse("2026-04-08T10:00:00Z"))
                .metrics(List.of(metric))
                .timeSeriesMetrics(List.of(tsMetric))
                .build();

        TestRun saved = adapter.save(testRun);
        assertNotNull(saved.getId());

        Optional<TestRun> found = adapter.findById(saved.getId());
        assertTrue(found.isPresent());

        TestRun loaded = found.get();
        assertEquals("MyApp", loaded.getApplicationName());
        assertEquals("2.0.1", loaded.getApplicationVersion());
        assertEquals("run-integration-test", loaded.getRunId());
        assertEquals(userId, loaded.getUserId());

        assertEquals(1, loaded.getMetrics().size());
        TestMetric loadedMetric = loaded.getMetrics().get(0);
        assertEquals("Login", loadedMetric.getRequestName());
        assertEquals(120.5, loadedMetric.getAvgResponseTime(), 0.01);
        assertEquals(200.0, loadedMetric.getPercentile98(), 0.01);
        assertEquals(0.02, loadedMetric.getErrorRate(), 0.001);

        assertEquals(1, loaded.getTimeSeriesMetrics().size());
        TestRunTimeSeriesMetric loadedTs = loaded.getTimeSeriesMetrics().get(0);
        assertEquals(0, loadedTs.getMinuteOffset());
        assertEquals(115.0, loadedTs.getAvgResponseTime(), 0.01);
    }

    @Test
    @DisplayName("findByUserIdAndApplicationName() returns matching runs sorted by timestamp desc")
    void findByUserAndApp() {
        UUID userId = UUID.randomUUID();

        TestRun run1 = createSimpleRun(userId, "App1", "1.0", Instant.parse("2026-04-01T10:00:00Z"));
        TestRun run2 = createSimpleRun(userId, "App1", "2.0", Instant.parse("2026-04-02T10:00:00Z"));
        TestRun run3 = createSimpleRun(userId, "OtherApp", "1.0", Instant.parse("2026-04-03T10:00:00Z"));

        adapter.save(run1);
        adapter.save(run2);
        adapter.save(run3);

        List<TestRun> results = adapter.findByUserIdAndApplicationName(userId, "App1");

        assertEquals(2, results.size());
        // Should be ordered by timestamp desc
        assertEquals("2.0", results.get(0).getApplicationVersion());
        assertEquals("1.0", results.get(1).getApplicationVersion());
    }

    private TestRun createSimpleRun(UUID userId, String appName, String version, Instant timestamp) {
        return TestRun.builder()
                .userId(userId)
                .applicationName(appName)
                .applicationVersion(version)
                .runId("run-" + version)
                .uploadTimestamp(timestamp)
                .metrics(List.of())
                .timeSeriesMetrics(List.of())
                .build();
    }
}
