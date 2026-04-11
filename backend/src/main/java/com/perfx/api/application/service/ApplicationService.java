package com.perfx.api.application.service;

import com.perfx.api.application.port.in.ManageApplicationUseCase;
import com.perfx.api.application.port.out.ApplicationRepository;
import com.perfx.api.domain.exception.DuplicateApplicationException;
import com.perfx.api.domain.model.Application;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ApplicationService implements ManageApplicationUseCase {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Application createApplication(UUID userId, String name) {
        applicationRepository.findByUserIdAndName(userId, name)
                .ifPresent(existing -> {
                    throw new DuplicateApplicationException(name);
                });

        Application application = Application.builder()
                .userId(userId)
                .name(name)
                .build();
        return applicationRepository.save(application);
    }

    @Override
    public List<Application> getApplications(UUID userId) {
        return applicationRepository.findByUserId(userId);
    }

    @Override
    public Application toggleFavorite(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        application.setFavorite(!application.isFavorite());
        return applicationRepository.save(application);
    }
}
