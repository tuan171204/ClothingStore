# Giai đoạn Build
FROM maven:3.9.4-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy file cấu hình trước để tận dụng cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy code backend
COPY src ./src
RUN mvn clean package -DskipTests

# Giai đoạn Chạy (Runtime)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Sửa lại lệnh copy để khớp với file jar được sinh ra
COPY --from=builder /app/target/*.jar app.jar

# Render thường sử dụng cổng biến môi trường $PORT, mặc định là 8080
EXPOSE 8080

# Cấu hình để Java nhận diện được file cấu hình bên ngoài hoặc profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]