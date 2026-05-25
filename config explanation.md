Here is what each added file does and what is inside it.

**1. `backend/src/main/resources/application.properties`**
Purpose: central config file for app-level and DB settings.

Content:
- `app.name` sets the application name.
- `server.port=8080` defines the local port used by the embedded Tomcat runner.
- `db.*` entries define the database connection:
  - `db.driver-class-name`
  - `db.url`
  - `db.username`
  - `db.password`
- The `${DB_URL:...}` syntax means:
  - use the environment variable if present
  - otherwise fall back to the default local MySQL value
- `db.hikari.*` configures the Hikari connection pool.
- `jpa.*` configures Hibernate:
  - dialect
  - SQL logging
  - SQL formatting
  - schema update mode
  - packages to scan for entities

Why it exists:
- Since this is not Spring Boot, we need a manual properties file and manual loading.

---

**2. `backend/src/main/java/com/okane/config/AppPropertiesConfig.java`**
Purpose: tells Spring to load `application.properties`.

Content:
- `@Configuration` marks it as a Spring config class.
- `@PropertySource("classpath:application.properties")` loads the properties file.
- `PropertySourcesPlaceholderConfigurer` enables `${...}` property injection inside `@Value`.

Why it exists:
- Without this, `@Value("${db.url}")` and similar injections would not resolve.

---

**3. `backend/src/main/java/com/okane/config/JpaConfig.java`**
Purpose: sets up JPA manually.

Content:
- `@EnableTransactionManagement` enables `@Transactional`.
- `@EnableJpaRepositories(basePackages = "com.okane")` activates Spring Data repositories.
- `@ComponentScan(...)` scans the app for non-controller Spring components.
- `dataSource()` creates a Hikari connection pool using the DB properties.
- `jpaVendorAdapter()` configures Hibernate as the JPA provider.
- `entityManagerFactory(...)` creates the JPA entity manager factory.
- `transactionManager(...)` creates the transaction manager for JPA.
- `exceptionTranslationPostProcessor()` lets Spring translate persistence exceptions into Spring’s data access exceptions.

Why it exists:
- This is the core database bootstrap for a non-Boot Spring app.

---

**4. `backend/src/main/java/com/okane/config/SecurityConfig.java`**
Purpose: basic Spring Security setup.

Content:
- `@EnableWebSecurity` activates Spring Security.
- `securityFilterChain(...)` defines the security filter chain.
- CSRF is disabled because this is intended for a stateless REST API.
- Session policy is set to `STATELESS`.
- All routes are currently permitted with `anyRequest().permitAll()`.
- HTTP basic is enabled as a placeholder.

Why it exists:
- It gives a working security skeleton.
- It is not final security; it is only a starter configuration.

Important note:
- This is still a permissive placeholder. Later it should be tightened with JWT and role rules.

---

**5. `backend/src/main/java/com/okane/config/WebConfig.java`**
Purpose: Spring MVC configuration.

Content:
- `@EnableWebMvc` activates MVC manually.
- `@ComponentScan` scans controller classes and controller advice.
- `configureDefaultServletHandling(...)` allows the container’s default servlet to serve static resources.
- `addResourceHandlers(...)` defines locations for:
  - `/assets/**`
  - `/webjars/**`
  - `/swagger-ui/**`

Why it exists:
- This is the manual MVC setup that replaces Boot auto-config.

---

**6. `backend/src/main/java/com/okane/config/CorsConfig.java`**
Purpose: CORS configuration.

Content:
- Adds a global CORS mapping for all routes.
- Allows all origins, methods, and headers.
- Allows credentials.

Why it exists:
- Angular frontend will call this backend from another origin during development.

Important note:
- This is broad and convenient for development, but later should be narrowed for production.

---

**7. `backend/src/main/java/com/okane/config/SwaggerConfig.java`**
Purpose: creates basic OpenAPI metadata.

Content:
- Returns an `OpenAPI` bean.
- Sets:
  - title
  - version

Why it exists:
- SpringDoc needs manual config in a non-Boot setup.

---

**8. `backend/src/main/java/com/okane/config/AppInitializer.java`**
Purpose: servlet initializer for a WAR-style Spring MVC app.

Content:
- Extends `AbstractAnnotationConfigDispatcherServletInitializer`.
- `getRootConfigClasses()` registers root configs:
  - `AppPropertiesConfig`
  - `JpaConfig`
  - `SecurityConfig`
- `getServletConfigClasses()` registers web-layer configs:
  - `WebConfig`
  - `CorsConfig`
  - `SwaggerConfig`
- `getServletMappings()` maps the DispatcherServlet to `/`.

Why it exists:
- This is the standard manual Spring MVC startup path when not using Spring Boot.

---

**9. `backend/src/main/java/com/okane/Main.java`**
Purpose: standalone entry point to run the backend from Maven with embedded Tomcat.

Content:
- Reads `application.properties`.
- Resolves the `server.port`.
- Creates an embedded Tomcat server.
- Creates a Spring web application context.
- Registers all config classes.
- Attaches a `DispatcherServlet`.
- Starts the server and waits.

It also includes `resolveWebappPath()`:
- tries `src/main/webapp`
- if not found, tries `backend/src/main/webapp`
- this makes startup a little more tolerant depending on how you launch Maven

Why it exists:
- Since you said this is Spring, not Spring Boot, you still needed a `main` path to run it locally.
- This gives you a direct command-line startup option.

---

**10. `backend/src/main/webapp/WEB-INF/web.xml`**
Purpose: minimal servlet deployment descriptor.

Content:
- Modern Jakarta EE 6 XML header.
- Display name only.

Why it exists:
- Keeps the WAR structure valid for container deployment.
- Since the app uses Java config and `AppInitializer`, the XML is minimal.

---

**How the pieces fit together**
- `application.properties` holds values.
- `AppPropertiesConfig` loads those values.
- `JpaConfig` uses them to create DB/JPA beans.
- `WebConfig` sets up MVC.
- `SecurityConfig` sets up security.
- `SwaggerConfig` sets up OpenAPI metadata.
- `AppInitializer` is the standard Spring MVC bootstrap for WAR/container deployment.
- `Main` is the local embedded-Tomcat launcher.

**Current status**
- The code compiles.
- The app should start, but it still depends on a reachable MySQL database.
- Security is only a placeholder right now, not the final JWT setup.

If you want, I can next do one of these:
1. Add a minimal `/api/health` endpoint so you can verify startup.
2. Tighten the security config for proper public/protected routes.
3. Clean up the package structure to match the project rules exactly.