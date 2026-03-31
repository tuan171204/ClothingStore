package com.example.clothingstore;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableRetry
@SpringBootApplication
@EnableAsync
@EnableRabbit
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
