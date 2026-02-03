# 1. Base Image
FROM eclipse-temurin:17-jdk-alpine

# 2. Add a Volume for temp files
VOLUME /tmp

# 3. Copy the built JAR file into the container
# This expects YOU to build the jar on your computer first
COPY build/libs/*.jar app.jar

# 4. Run the application
ENTRYPOINT ["java","-jar","/app.jar"]