package com.perfx.api.application.service;

import com.perfx.api.application.port.in.UploadTestResultUseCase;
import com.perfx.api.application.port.in.GetTestRunsUseCase;
import com.perfx.api.application.port.in.CompareTestRunsUseCase;
import com.perfx.api.application.port.out.TestResultParser;
import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.model.MetricComparison;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class TestRunService implements UploadTestResultUseCase, GetTestRunsUseCase, CompareTestRunsUseCase {

    private final TestRunRepository testRunRepository;
    private final List<TestResultParser> parsers;

    public TestRunService(TestRunRepository testRunRepository, List<TestResultParser> parsers) {
        this.testRunRepository = testRunRepository;
        this.parsers = parsers;
    }

    @Override
    public TestRun upload(UUID userId, String applicationName, String applicationVersion, String runId, String tool, InputStream fileStream) {
        TestResultParser parser = parsers.stream()
                .filter(p -> p.supports(tool))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported format or tool: " + tool));

        com.perfx.api.domain.model.ParsedMetrics parsed = parser.parse(fileStream);

        TestRun testRun = TestRun.builder()
                .userId(userId)
                .applicationName(applicationName)
                .applicationVersion(applicationVersion)
                .runId(runId != null && !runId.isEmpty() ? runId : String.valueOf(Instant.now().toEpochMilli()))
                .uploadTimestamp(Instant.now())
                .metrics(parsed.getAggregateMetrics())
                .timeSeriesMetrics(parsed.getTimeSeriesMetrics())
                .build();
                
        parsed.getAggregateMetrics().forEach(m -> m.setTestRunId(testRun.getId()));
        parsed.getTimeSeriesMetrics().forEach(m -> m.setTestRunId(testRun.getId()));

        return testRunRepository.save(testRun);
    }

    @Override
    public List<TestRun> getRecentRuns(UUID userId, String applicationName) {
        return testRunRepository.findByUserIdAndApplicationName(userId, applicationName);
    }

    @Override
    public TestRun getRunDetails(UUID testRunId) {
        return testRunRepository.findById(testRunId)
                .orElseThrow(() -> new NoSuchElementException("TestRun not found"));
    }

    @Override
    public List<MetricComparison> compare(UUID baseRunId, UUID targetRunId) {
        TestRun baseRun = getRunDetails(baseRunId);
        TestRun targetRun = getRunDetails(targetRunId);

        Map<String, TestMetric> baseMetrics = baseRun.getMetrics().stream()
                .collect(Collectors.toMap(TestMetric::getRequestName, m -> m));
        
        List<MetricComparison> comparisons = new ArrayList<>();

        for (TestMetric targetObj : targetRun.getMetrics()) {
            TestMetric baseObj = baseMetrics.get(targetObj.getRequestName());
            if (baseObj != null) {
                double avgTimeDiff = 0.0;
                if (baseObj.getAvgResponseTime() > 0) {
                    avgTimeDiff = ((targetObj.getAvgResponseTime() - baseObj.getAvgResponseTime()) / baseObj.getAvgResponseTime()) * 100;
                }
                
                double thDiff = 0.0;
                if (baseObj.getThroughput() > 0) {
                    thDiff = ((targetObj.getThroughput() - baseObj.getThroughput()) / baseObj.getThroughput()) * 100;
                }

                comparisons.add(MetricComparison.builder()
                        .requestName(targetObj.getRequestName())
                        .baseAvgResponseTime(baseObj.getAvgResponseTime())
                        .targetAvgResponseTime(targetObj.getAvgResponseTime())
                        .avgResponseTimeDiffPercent(avgTimeDiff)
                        .baseThroughput(baseObj.getThroughput())
                        .targetThroughput(targetObj.getThroughput())
                        .throughputDiffPercent(thDiff)
                        .build());
            }
        }
        
        return comparisons;
    }
}
