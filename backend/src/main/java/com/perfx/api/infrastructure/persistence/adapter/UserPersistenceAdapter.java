package com.perfx.api.infrastructure.persistence.adapter;

import com.perfx.api.application.port.out.UserRepository;
import com.perfx.api.domain.model.User;
import com.perfx.api.infrastructure.persistence.mapper.UserMapper;
import com.perfx.api.infrastructure.persistence.repo.SpringDataUserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class UserPersistenceAdapter implements UserRepository {

    private final SpringDataUserRepository repository;
    private final UserMapper mapper;

    public UserPersistenceAdapter(SpringDataUserRepository repository, UserMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public User save(User user) {
        return mapper.toDomain(repository.save(mapper.toEntity(user)));
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }
}
