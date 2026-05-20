# Okane Transfer — Project Rules

## 1. Global Rule

This project is a **Spring MVC monolithic application**, not a Spring Boot project.

Always respect:

```text
Spring = Spring MVC / Spring ecosystem
Spring Boot = forbidden
Microservices = forbidden
Monolith = required
```

---

## 2. Architecture Rules

### Required Architecture

Use layered architecture:

```text
Controller → Service → Repository → Database
```

Allowed layers:

1. Controller layer
2. Service layer
3. Repository layer
4. Entity layer
5. DTO layer
6. Configuration layer
7. Infrastructure layer

### Forbidden

- Do not put business logic in controllers.
- Do not call repositories directly from controllers.
- Do not expose JPA entities directly in API responses.
- Do not mix frontend logic with backend logic.
- Do not create microservices.
- Do not use Spring Boot annotations.

Forbidden annotations/classes:

```java
@SpringBootApplication
SpringApplication.run(...)
application.yml Spring Boot auto-config style
```

---

## 3. Spring MVC Rules

Use manual configuration.

Required configuration classes:

- `WebConfig.java`
- `SecurityConfig.java`
- `JpaConfig.java`
- `SwaggerConfig.java`
- `CorsConfig.java`

The application should use:

- `DispatcherServlet`
- `AbstractAnnotationConfigDispatcherServletInitializer`
- Manual servlet configuration
- Manual Spring Security filter chain

Example initializer idea:

```java
public class AppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {
    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[] { JpaConfig.class, SecurityConfig.class };
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebConfig.class, SwaggerConfig.class };
    }

    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" };
    }
}
```

---

## 4. Package Rules

Use business-module-based packages.

Recommended structure:

```text
com.okane.transfer
│
├── config
├── common
├── auth
├── user
├── agency
├── transfer
├── cash
├── currency
├── fee
├── notification
├── compliance
├── reporting
├── chatbot
├── mobilemoney
└── audit
```

Each module should follow this structure when needed:

```text
module
├── controller
├── service
├── repository
├── entity
├── dto
├── mapper
└── exception
```

---

## 5. Controller Rules

Controllers must only handle HTTP concerns.

Controllers can:

- Receive requests
- Validate DTOs
- Call services
- Return responses

Controllers must not:

- Contain business logic
- Use repositories directly
- Build complex calculations
- Manage transactions manually

Example:

```java
@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransferResponse>> createTransfer(
            @Valid @RequestBody CreateTransferRequest request) {
        TransferResponse response = transferService.createTransfer(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

## 6. Service Rules

Services contain business logic.

Services must:

- Validate business rules
- Use repositories
- Manage transactions
- Call other services when needed
- Return DTOs or business results

Use `@Transactional` in service methods that modify data.

Example:

```java
@Service
public class TransferServiceImpl implements TransferService {

    @Transactional
    public TransferResponse createTransfer(CreateTransferRequest request) {
        // business rules here
        // create transfer
        // create cash movement
        // create audit log
        // return response DTO
    }
}
```

---

## 7. Repository Rules

Repositories must only handle database access.

Use Spring Data JPA repositories.

Example:

```java
public interface TransferRepository extends JpaRepository<Transfer, Long> {
    Optional<Transfer> findByReference(String reference);
}
```

Repositories must not:

- Contain business workflow logic
- Return API response DTOs directly unless using projections intentionally
- Handle security logic

---

## 8. Entity Rules

Entities represent database tables.

Rules:

- Use JPA annotations.
- Keep entities clean.
- Avoid putting heavy business logic inside entities.
- Use enums for fixed statuses.
- Use `BigDecimal` for money.
- Never use `double` or `float` for money.

Example:

```java
@Column(nullable = false, precision = 19, scale = 4)
private BigDecimal amount;
```

---

## 9. DTO Rules

Use DTOs for all API input and output.

Required DTO types:

```text
CreateXRequest
UpdateXRequest
XResponse
XSummaryResponse
SearchXCriteria
```

Rules:

- Requests must use validation annotations.
- Responses must not expose sensitive fields.
- Never expose password hashes.
- Never expose internal token secrets.
- Never expose full identity document data unless required.

Example:

```java
public class CreateTransferRequest {

    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String senderPhone;

    @NotBlank
    private String beneficiaryPhone;
}
```

---

## 10. Mapper Rules

Use mapper classes to convert entities to DTOs.

Example:

```java
@Component
public class TransferMapper {
    public TransferResponse toResponse(Transfer transfer) {
        TransferResponse response = new TransferResponse();
        response.setReference(transfer.getReference());
        response.setStatus(transfer.getStatus());
        response.setAmount(transfer.getAmount());
        return response;
    }
}
```

Do not manually repeat mapping logic everywhere.

---

## 11. Security Rules

Security is mandatory.

Use:

- Spring Security 6
- JWT access tokens
- Refresh tokens
- Stateless sessions
- BCrypt password encoder with strength 12
- Role-based authorization
- Security filter chain before DispatcherServlet

Rules:

- Disable CSRF for REST API.
- Configure CORS.
- Protect all sensitive routes.
- Public endpoints must be explicitly declared.
- Never store passwords in plain text.
- Never log passwords or tokens.

Example role mapping:

```text
ROLE_ADMIN
ROLE_MANAGER
ROLE_AGENT
ROLE_CLIENT
```

Access example:

```text
/admin/**      → ADMIN only
/manager/**    → MANAGER or ADMIN
/agent/**      → AGENT or MANAGER or ADMIN
/client/**     → CLIENT only
/auth/**       → public
```

---

## 12. JWT Rules

Access token:

```text
Duration: 1 hour
```

Refresh token:

```text
Duration: 7 days
```

Rules:

- Store refresh tokens in database.
- Invalidate refresh token on logout.
- Validate token signature.
- Validate token expiration.
- Include user ID and roles in claims.
- Do not store sensitive data in JWT claims.

---

## 13. Validation Rules

Use Jakarta Validation.

Common annotations:

```java
@NotNull
@NotBlank
@NotEmpty
@Email
@Size
@Pattern
@Positive
@PositiveOrZero
```

Business validation must be inside services.

Example validations:

- Amount must be positive.
- Sender phone is required.
- Beneficiary phone is required.
- Currency must exist.
- Corridor must be active.
- Agent must have active cash session.
- Transfer must not be already paid.

---

## 14. Exception Handling Rules

Use global exception handling.

Create:

```text
GlobalExceptionHandler
BusinessException
ResourceNotFoundException
UnauthorizedException
ForbiddenException
ValidationException
```

API errors should be consistent.

Example response:

```json
{
  "success": false,
  "message": "Transfer not found",
  "errors": [],
  "timestamp": "2026-05-20T12:00:00"
}
```

---

## 15. API Response Rules

Use a common response wrapper.

Example:

```java
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
}
```

Use clear HTTP status codes:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
```

---

## 16. Money Rules

Always use `BigDecimal` for money.

Rules:

- Never use `double` for amounts.
- Never use `float` for amounts.
- Always store currency with amount.
- Always define precision and scale.
- Keep exchange rate history.

Example:

```java
private BigDecimal sentAmount;
private BigDecimal feeAmount;
private BigDecimal exchangeRate;
private BigDecimal receivedAmount;
```

---

## 17. Transfer Business Rules

Transfer creation must check:

- Sender exists or sender info is valid.
- Beneficiary info is valid.
- Amount is positive.
- Source currency exists.
- Destination currency exists.
- Transfer corridor is active.
- Fee grid exists.
- Agent has active cash session.
- Compliance rules pass.

Payout must check:

- Transfer exists.
- Transfer status is PENDING.
- Transfer is not expired.
- Transfer is not cancelled.
- Transfer is not blocked.
- Beneficiary identity is verified.
- Agent has active cash session.
- Payout amount equals expected received amount.

Partial payout is not allowed by default.

---

## 18. Cash Session Rules

Every agent must open a cash session before doing money operations.

Rules:

- One active cash session per agent per day.
- Transfers must be linked to a cash session.
- Payouts must be linked to a cash session.
- Closing balance must be entered by agent.
- Expected balance must be calculated by system.
- Difference must be reported.

Expected balance:

```text
expected_balance = opening_balance + cash_in - cash_out + adjustment_in - adjustment_out
```

If there is a difference:

```text
cash_difference = real_closing_balance - expected_balance
```

Create a `CashDifferenceReport` if difference is not zero.

---

## 19. Currency & FX Rules

Rules:

- Currency code must use ISO format like MAD, EUR, USD.
- Exchange rates must have effective date.
- Old exchange rates must not be deleted.
- Use exchange rate history.
- Transfers must store the exchange rate used at creation time.
- Do not recalculate old transfers using new exchange rates.

---

## 20. Fees & Commission Rules

Rules:

- Fees are calculated using fee grids and fee brackets.
- Fee bracket is an amount interval.
- Each transfer must store calculated fees.
- Agency commission and central commission must be stored.
- Do not recalculate old transfers if fee rules change.

---

## 21. Compliance Rules

Compliance checks must run before transfer validation.

Check:

- KYC document availability
- Blacklist match
- Suspicious amount
- Repeated transactions
- Threshold exceedance

If suspicious:

- Mark transfer as BLOCKED or UNDER_REVIEW.
- Create compliance alert.
- Notify manager/admin if needed.

Use fictive data only.

---

## 22. Audit Rules

Every sensitive action must create an audit log.

Audit these actions:

- Login success
- Login failure
- Transfer creation
- Transfer payout
- Transfer cancellation
- Exchange rate update
- Fee grid update
- User creation
- User suspension
- Agency suspension
- Compliance alert review
- Cash session opening
- Cash session closing

Audit log should contain:

```text
actor_id
actor_role
action
entity_type
entity_id
timestamp
ip_address if available
details
```

---

## 23. Database Rules

Use clear table names.

Recommended naming:

```text
snake_case table names
snake_case column names
```

Examples:

```text
users
roles
user_roles
agencies
transfers
agent_cash_sessions
cash_movements
exchange_rates
fee_grids
fee_brackets
audit_logs
```

Rules:

- Use primary keys.
- Use foreign keys.
- Use indexes on search fields.
- Use unique constraints where needed.
- Avoid nullable fields unless justified.
- Use enum columns carefully.

Important indexes:

```text
transfer.reference
transfer.withdrawal_code
user.email
user.phone
agency.code
cash_session.agent_id + session_date
```

---

## 24. Swagger Rules

Swagger must document all REST APIs.

Because this is not Spring Boot:

- Configure SpringDoc manually.
- Configure Swagger UI manually.
- Group APIs by module when possible.

Each endpoint should have:

- Summary
- Description
- Request body
- Response examples
- Error responses
- Security requirement if protected

---

## 25. Git Rules

Use Git properly.

Rules:

- Use private GitHub repository.
- Make at least 3 commits per week.
- Never push secrets.
- Never push real passwords.
- Never push private keys.
- Use `.gitignore`.
- Use branches for features.

Branch examples:

```text
main
dev
feature/auth
feature/transfer
feature/cash-session
feature/frontend-auth
```

Commit examples:

```text
feat(auth): add JWT login endpoint
feat(transfer): create transfer workflow
fix(cash): correct expected balance calculation
chore(config): add manual Spring MVC config
```

---

## 26. Secret Management Rules

Never commit:

```text
Database password
JWT secret
SMTP password
API keys
Private keys
.env files
application.properties containing secrets
```

Use environment variables.

Example:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
JWT_ACCESS_EXPIRATION
JWT_REFRESH_EXPIRATION
```

---

## 27. Frontend Rules

Angular must use:

- Components
- Services
- Guards
- Interceptors
- Routing
- Reactive forms
- Chart.js for dashboards

Rules:

- Store JWT carefully.
- Attach token using HTTP interceptor.
- Protect routes using guards.
- Use DTO-compatible interfaces.
- Keep API URLs in environment files.
- Do not hardcode secrets in frontend.

---

## 28. Naming Rules

Use clear names.

Java:

```text
ClassName
methodName
variableName
CONSTANT_NAME
```

Database:

```text
snake_case
```

API routes:

```text
/api/auth/login
/api/transfers
/api/transfers/{reference}
/api/cash-sessions/open
/api/cash-sessions/close
```

---

## 29. Time Rules

Use:

```java
LocalDate
LocalDateTime
Instant
```

Rules:

- Use `LocalDate` for session date.
- Use `LocalDateTime` for business timestamps.
- Use `Instant` if UTC precision is needed.
- Store createdAt and updatedAt where useful.

---

## 30. Team Priority Rules

Build in this order:

1. Project structure
2. Manual Spring MVC configuration
3. Database configuration
4. Auth and roles
5. Agency module
6. Agent cash session module
7. Currency module
8. Fee module
9. Transfer creation
10. Payout workflow
11. Audit logs
12. Basic reporting
13. Compliance basic rules
14. Notifications simulation
15. Angular frontend integration
16. Chatbot simulation
17. Mobile money simulation
18. Final demo polish

Do not start advanced features before the core transfer workflow works.

---

## 31. Definition of Done

A feature is done only if:

- Entity exists
- Repository exists
- Service exists
- Controller exists
- DTOs exist
- Validation exists
- Errors are handled
- Security is respected
- Swagger documentation exists
- Basic manual test is successful
- Audit log is added if action is sensitive

---

## 32. Final Rule

Always prefer a working, clean, secure core system over too many unfinished advanced features.

The most important demo flow is:

```text
Login → Open agent cash session → Create transfer → Search transfer → Pay transfer → Close cash session → View report
```
