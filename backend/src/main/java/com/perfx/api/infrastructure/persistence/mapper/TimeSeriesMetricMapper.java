package com.perfx.api.infrastructure.persistence.mapper;

import com.perfx.api.domain.model.TestRunTimeSeriesMetric;
import com.perfx.api.infrastructure.persistence.entity.TestRunTimeSeriesMetricEntity;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TimeSeriesMetricMapper {

    TimeSeriesMetricMapper INSTANCE = Mappers.getMapper(TimeSeriesMetricMapper.class);

    TestRunTimeSeriesMetricEntity toEntity(TestRunTimeSeriesMetric domain);

    TestRunTimeSeriesMetric toDomain(TestRunTimeSeriesMetricEntity entity);
}
