package com.perfx.api.application.service;

import com.perfx.api.application.port.in.LoginUserUseCase;
import com.perfx.api.application.port.in.RegisterUserUseCase;
import com.perfx.api.application.port.in.EditUserProfileUseCase;
import com.perfx.api.application.port.out.UserRepository;
import com.perfx.api.domain.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserService implements LoginUserUseCase, RegisterUserUseCase, EditUserProfileUseCase {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User login(String email, String rawPassword) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            return user.get();
        }
        return null;
    }

    @Override
    public User register(String email, String rawPassword, String firstName, String lastName) {
        User user = User.builder()
                .email(email)
                .passwordHash(rawPassword) // MVP: no hashing
                .firstName(firstName)
                .lastName(lastName)
                .build();
        return userRepository.save(user);
    }

    @Override
    public User editProfile(java.util.UUID userId, String firstName, String lastName, String profilePictureUrl) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setProfilePictureUrl(profilePictureUrl);
        return userRepository.save(user);
    }
}
