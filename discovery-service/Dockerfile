# 1. Base Image
FROM eclipse-temurin:17-jdk-alpine

# 2. Add a Volume for temp files
VOLUME /tmp

# 3. Copy the built JAR file into the container
# IMPORTANT: You must run './gradlew clean build -x test' before building docker images
COPY build/libs/*.jar app.jar

# 4. Run the application
ENTRYPOINT ["java","-jar","/app.jar"]
