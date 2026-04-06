package com.perfx.api.infrastructure.config;

import com.perfx.api.infrastructure.persistence.entity.UserEntity;
import com.perfx.api.infrastructure.persistence.repo.SpringDataUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final SpringDataUserRepository userRepository;

    public DataLoader(SpringDataUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setPasswordHash("hashedadmin");
            userRepository.save(admin);
        }
    }
}
