package com.perfx.api.infrastructure.persistence.mapper;

import com.perfx.api.domain.model.TestMetric;
import com.perfx.api.infrastructure.persistence.entity.TestMetricEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TestMetricMapper {

    TestMetricMapper INSTANCE = Mappers.getMapper(TestMetricMapper.class);

    TestMetricEntity toEntity(TestMetric domain);

    TestMetric toDomain(TestMetricEntity entity);
}
