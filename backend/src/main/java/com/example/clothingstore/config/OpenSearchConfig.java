package com.example.clothingstore.config;

import jakarta.validation.constraints.NotBlank;
import org.opensearch.client.RestHighLevelClient;
import org.opensearch.data.client.orhlc.AbstractOpenSearchConfiguration;
import org.opensearch.data.client.orhlc.ClientConfiguration;
import org.opensearch.data.client.orhlc.RestClients;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "bonsai.opensearch")
record OpenSearchProperties(
        @NotBlank(message = "Bonsai OpenSearch URL không được để trống") String url,
        @NotBlank(message = "Bonsai OpenSearch username không được để trống") String username,
        @NotBlank(message = "Bonsai OpenSearch password không được để trống") String password
) {}

@Configuration
@EnableConfigurationProperties(OpenSearchProperties.class)
public class OpenSearchConfig extends AbstractOpenSearchConfiguration {

    private final OpenSearchProperties properties;

    public OpenSearchConfig(OpenSearchProperties properties) {
        this.properties = properties;
    }

    @Override
    public RestHighLevelClient opensearchClient() {
        ClientConfiguration clientConfiguration = ClientConfiguration.builder()
                .connectedTo(properties.url())
                .usingSsl()
                .withBasicAuth(properties.username(), properties.password())
                .build();

        return RestClients.create(clientConfiguration).rest();
    }
}