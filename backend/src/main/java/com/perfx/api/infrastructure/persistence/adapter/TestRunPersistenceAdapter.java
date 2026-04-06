package com.perfx.api.infrastructure.persistence.adapter;

import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.domain.model.TestRun;
import com.perfx.api.infrastructure.persistence.entity.TestMetricEntity;
import com.perfx.api.infrastructure.persistence.entity.TestRunEntity;
import com.perfx.api.infrastructure.persistence.repo.SpringDataTestRunRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class TestRunPersistenceAdapter implements TestRunRepository {

    private final SpringDataTestRunRepository repository;

    public TestRunPersistenceAdapter(SpringDataTestRunRepository repository) {
        this.repository = repository;
    }

    @Override
    public TestRun save(TestRun testRun) {
        TestRunEntity entity = mapToEntity(testRun);
        if (entity.getMetrics() != null) {
            entity.getMetrics().forEach(m -> m.setTestRunId(entity.getId()));
        }
        TestRunEntity saved = repository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<TestRun> findById(UUID id) {
        return repository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<TestRun> findByUserIdAndApplicationName(UUID userId, String applicationName) {
        return repository.findByUserIdAndApplicationNameOrderByUploadTimestampDesc(userId, applicationName)
                .stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    private TestRunEntity mapToEntity(TestRun domain) {
        TestRunEntity entity = new TestRunEntity();
        if (domain.getId() != null) entity.setId(domain.getId());
        entity.setUserId(domain.getUserId());
        entity.setApplicationName(domain.getApplicationName());
        entity.setApplicationVersion(domain.getApplicationVersion());
        entity.setRunId(domain.getRunId());
        entity.setUploadTimestamp(domain.getUploadTimestamp());
        
        if (domain.getMetrics() != null) {
            List<TestMetricEntity> metrics = domain.getMetrics().stream().map(m -> {
                TestMetricEntity me = new TestMetricEntity();
                me.setId(m.getId());
                me.setTestRunId(domain.getId());
                me.setRequestName(m.getRequestName());
                me.setAvgResponseTime(m.getAvgResponseTime());
                me.setPercentile90(m.getPercentile90());
                me.setPercentile95(m.getPercentile95());
                me.setPercentile98(m.getPercentile98());
                me.setThroughput(m.getThroughput());
                me.setErrorRate(m.getErrorRate());
                me.setErrorCode(m.getErrorCode());
                return me;
            }).collect(Collectors.toList());
            entity.setMetrics(metrics);
        }
        return entity;
    }

    private TestRun mapToDomain(TestRunEntity entity) {
        List<TestMetric> metrics = null;
        if (entity.getMetrics() != null) {
             metrics = entity.getMetrics().stream().map(me -> TestMetric.builder()
                .id(me.getId())
                .testRunId(me.getTestRunId())
                .requestName(me.getRequestName())
                .avgResponseTime(me.getAvgResponseTime())
                .percentile90(me.getPercentile90())
                .percentile95(me.getPercentile95())
                .percentile98(me.getPercentile98())
                .throughput(me.getThroughput())
                .errorRate(me.getErrorRate())
                .errorCode(me.getErrorCode())
                .build()
             ).collect(Collectors.toList());
        }

        return TestRun.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .applicationName(entity.getApplicationName())
                .applicationVersion(entity.getApplicationVersion())
                .runId(entity.getRunId())
                .uploadTimestamp(entity.getUploadTimestamp())
                .metrics(metrics)
                .build();
    }
}
