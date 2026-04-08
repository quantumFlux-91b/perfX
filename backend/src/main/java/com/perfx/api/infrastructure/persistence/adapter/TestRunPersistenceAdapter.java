package com.perfx.api.infrastructure.persistence.adapter;

import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.model.TestRun;
import com.perfx.api.infrastructure.persistence.entity.TestRunEntity;
import com.perfx.api.infrastructure.persistence.mapper.TestRunMapper;
import com.perfx.api.infrastructure.persistence.repo.SpringDataTestRunRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class TestRunPersistenceAdapter implements TestRunRepository {

    private final SpringDataTestRunRepository repository;
    private final TestRunMapper mapper;

    public TestRunPersistenceAdapter(SpringDataTestRunRepository repository, TestRunMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public TestRun save(TestRun testRun) {
        TestRunEntity entity = mapper.toEntity(testRun);
        if (entity.getMetrics() != null) {
            entity.getMetrics().forEach(m -> m.setTestRunId(entity.getId()));
        }
        if (entity.getTimeSeriesMetrics() != null) {
            entity.getTimeSeriesMetrics().forEach(m -> m.setTestRunId(entity.getId()));
        }
        TestRunEntity saved = repository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<TestRun> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<TestRun> findByUserIdAndApplicationName(UUID userId, String applicationName) {
        return repository.findByUserIdAndApplicationNameOrderByUploadTimestampDesc(userId, applicationName)
                .stream().map(mapper::toDomain).collect(Collectors.toList());
    }
}
