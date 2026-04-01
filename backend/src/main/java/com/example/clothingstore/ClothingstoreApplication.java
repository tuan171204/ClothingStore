package com.example.clothingstore;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchDataAutoConfiguration;
import org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchClientAutoConfiguration;

@EnableRetry
@EnableAsync
@EnableRabbit
@SpringBootApplication(exclude = {
		ElasticsearchClientAutoConfiguration.class,
		ElasticsearchDataAutoConfiguration.class,
		ElasticsearchRepositoriesAutoConfiguration.class
})
public class ClothingstoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClothingstoreApplication.class, args);
	}

//	@Bean
//	public CommandLineRunner commandLineRunner(@Value("${api.prefix}") String apiPrefix) {
//		return args -> {
//			System.out.println("==================================");
//			System.out.println("GIÁ TRỊ API PREFIX HIỆN TẠI LÀ: '" + apiPrefix + "'");
//			System.out.println("==================================");
//		};
//	}
}
