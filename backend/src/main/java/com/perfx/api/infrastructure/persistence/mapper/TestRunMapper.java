package com.perfx.api.infrastructure.persistence.mapper;

import com.perfx.api.domain.model.TestRun;
import com.perfx.api.infrastructure.persistence.entity.TestRunEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring", uses = {TestMetricMapper.class, TimeSeriesMetricMapper.class})
public interface TestRunMapper {

    TestRunMapper INSTANCE = Mappers.getMapper(TestRunMapper.class);

    TestRunEntity toEntity(TestRun domain);

    TestRun toDomain(TestRunEntity entity);
}
