package com.perfx.api.application.port.out;

import com.perfx.api.domain.model.Application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository {
    Application save(Application application);
    List<Application> findByUserId(UUID userId);
    Optional<Application> findByUserIdAndName(UUID userId, String name);
    Optional<Application> findById(UUID id);
}
