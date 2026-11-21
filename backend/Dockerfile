# ==========================================
# Estágio 1: Build (Compilação da aplicação)
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copia a estrutura do Maven Wrapper e o pom.xml
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Garante permissões de execução e compatibilidade de quebra de linha
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw

# Copia o código-fonte
COPY src/ src/

# Compila o projeto e empacota o JAR executável
RUN ./mvnw clean package -DskipTests -B

# Copia o JAR gerado para um nome fixo e previsível
RUN cp target/*.jar app.jar

# ==========================================
# Estágio 2: Runtime (Execução do JAR gerado)
# ==========================================
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Cria usuário não-root por boas práticas de segurança
RUN addgroup --system letterweb && adduser --system --ingroup letterweb letterweb

# Copia apenas o JAR final do estágio de build
COPY --from=builder --chown=letterweb:letterweb /app/app.jar app.jar

# Define o usuário não-root
USER letterweb:letterweb

# Define a porta padrão (o Render sobrescreve a variável PORT automaticamente)
ENV PORT=8080
EXPOSE 8080

# Inicia a aplicação passando a variável PORT para o Spring Boot
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-8080} -jar app.jar"]
