package com.perfx.api.infrastructure.persistence.mapper;

import com.perfx.api.domain.model.Application;
import com.perfx.api.infrastructure.persistence.entity.ApplicationEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    ApplicationMapper INSTANCE = Mappers.getMapper(ApplicationMapper.class);

    ApplicationEntity toEntity(Application domain);

    Application toDomain(ApplicationEntity entity);
}
