package com.perfx.api.application.service;

import com.perfx.api.application.port.in.CompareTestRunsUseCase;
import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.exception.TestRunNotFoundException;
import com.perfx.api.domain.model.MetricComparison;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ComparisonService implements CompareTestRunsUseCase {

    private final TestRunRepository testRunRepository;

    public ComparisonService(TestRunRepository testRunRepository) {
        this.testRunRepository = testRunRepository;
    }

    @Override
    public List<MetricComparison> compare(UUID baseRunId, UUID targetRunId) {
        TestRun baseRun = testRunRepository.findById(baseRunId)
                .orElseThrow(() -> new TestRunNotFoundException(baseRunId));
        TestRun targetRun = testRunRepository.findById(targetRunId)
                .orElseThrow(() -> new TestRunNotFoundException(targetRunId));

        Map<String, TestMetric> baseMetrics = baseRun.getMetrics().stream()
                .collect(Collectors.toMap(TestMetric::getRequestName, m -> m));

        List<MetricComparison> comparisons = new ArrayList<>();

        for (TestMetric target : targetRun.getMetrics()) {
            TestMetric base = baseMetrics.get(target.getRequestName());
            if (base == null) {
                continue;
            }

            comparisons.add(MetricComparison.builder()
                    .requestName(target.getRequestName())
                    .baseAvgResponseTime(base.getAvgResponseTime())
                    .targetAvgResponseTime(target.getAvgResponseTime())
                    .avgResponseTimeDiffPercent(percentDiff(base.getAvgResponseTime(), target.getAvgResponseTime()))
                    .baseThroughput(base.getThroughput())
                    .targetThroughput(target.getThroughput())
                    .throughputDiffPercent(percentDiff(base.getThroughput(), target.getThroughput()))
                    .baseErrorRate(base.getErrorRate())
                    .targetErrorRate(target.getErrorRate())
                    .errorRateDiffPercent(percentDiff(base.getErrorRate(), target.getErrorRate()))
                    .baseP98(base.getPercentile98())
                    .targetP98(target.getPercentile98())
                    .p98DiffPercent(percentDiff(base.getPercentile98(), target.getPercentile98()))
                    .build());
        }

        return comparisons;
    }

    private static double percentDiff(double base, double target) {
        if (base == 0.0) {
            return 0.0;
        }
        return ((target - base) / base) * 100.0;
    }
}
