package com.perfx.api.infrastructure.config;

import com.perfx.api.application.port.out.UserRepository;
import com.perfx.api.domain.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;

    public DataLoader(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@example.com")
                    .passwordHash("hashedadmin")
                    .build();
            userRepository.save(admin);
        }
    }
}
