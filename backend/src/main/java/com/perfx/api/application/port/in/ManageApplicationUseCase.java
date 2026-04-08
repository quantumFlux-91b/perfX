package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.Application;

import java.util.List;
import java.util.UUID;

public interface ManageApplicationUseCase {
    Application createApplication(UUID userId, String name);
    List<Application> getApplications(UUID userId);
}
