package com.example.clothingstore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ClothingstoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClothingstoreApplication.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner(@Value("${api.prefix}") String apiPrefix) {
		return args -> {
			System.out.println("==================================");
			System.out.println("GIÁ TRỊ API PREFIX HIỆN TẠI LÀ: '" + apiPrefix + "'");
			System.out.println("==================================");
		};
	}
}
