package com.perfx.api.infrastructure.persistence.repo;

import com.perfx.api.infrastructure.persistence.entity.ApplicationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

public interface SpringDataApplicationRepository extends JpaRepository<ApplicationEntity, UUID> {
    List<ApplicationEntity> findByUserId(UUID userId);
    Optional<ApplicationEntity> findByUserIdAndName(UUID userId, String name);
}
