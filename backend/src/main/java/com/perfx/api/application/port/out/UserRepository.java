package com.perfx.api.application.port.out;

import com.perfx.api.domain.model.User;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    User save(User user);
    Optional<User> findByUsername(String username);
    Optional<User> findById(UUID id);
}
