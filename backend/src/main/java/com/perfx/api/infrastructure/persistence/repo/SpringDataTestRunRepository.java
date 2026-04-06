package com.perfx.api.infrastructure.persistence.repo;

import com.perfx.api.infrastructure.persistence.entity.TestRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SpringDataTestRunRepository extends JpaRepository<TestRunEntity, UUID> {
    List<TestRunEntity> findByUserIdAndApplicationNameOrderByUploadTimestampDesc(UUID userId, String applicationName);
}
