package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.User;
import java.util.UUID;

public interface EditUserProfileUseCase {
    User editProfile(UUID userId, String firstName, String lastName, String profilePictureUrl);
}
