package com.perfx.api.infrastructure.persistence.adapter;

import com.perfx.api.application.port.out.ApplicationRepository;
import com.perfx.api.domain.model.Application;
import com.perfx.api.infrastructure.persistence.mapper.ApplicationMapper;
import com.perfx.api.infrastructure.persistence.repo.SpringDataApplicationRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ApplicationPersistenceAdapter implements ApplicationRepository {

    private final SpringDataApplicationRepository repository;
    private final ApplicationMapper mapper;

    public ApplicationPersistenceAdapter(SpringDataApplicationRepository repository, ApplicationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Application save(Application application) {
        return mapper.toDomain(repository.save(mapper.toEntity(application)));
    }

    @Override
    public List<Application> findByUserId(UUID userId) {
        return repository.findByUserId(userId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Application> findByUserIdAndName(UUID userId, String name) {
        return repository.findByUserIdAndName(userId, name).map(mapper::toDomain);
    }
}
