package com.perfx.api.infrastructure.persistence.mapper;

import com.perfx.api.domain.model.User;
import com.perfx.api.infrastructure.persistence.entity.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    UserEntity toEntity(User domain);

    User toDomain(UserEntity entity);
}
