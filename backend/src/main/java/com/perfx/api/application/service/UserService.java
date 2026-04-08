package com.perfx.api.application.service;

import com.perfx.api.application.port.in.LoginUserUseCase;
import com.perfx.api.application.port.in.RegisterUserUseCase;
import com.perfx.api.application.port.out.UserRepository;
import com.perfx.api.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService implements LoginUserUseCase, RegisterUserUseCase {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public String login(String username, String rawPassword) {
        // MVP: only verify user exists, no password check
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent()) {
            return user.get().getId().toString();
        }
        return null;
    }

    @Override
    public User register(String username, String rawPassword) {
        User user = User.builder()
                .username(username)
                .passwordHash(rawPassword) // MVP: no hashing
                .build();
        return userRepository.save(user);
    }
}
