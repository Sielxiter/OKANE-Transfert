# Okane Transfer — Project Context

## 1. Project Overview

**Project name:** Okane Transfer  
**Type:** Web application for money transfer management  
**Domain:** Financial transfer platform similar to Western Union / MoneyGram  
**Architecture:** Monolithic layered architecture  
**Important constraint:** Spring means Spring MVC / Spring ecosystem, **not Spring Boot**.

Okane Transfer is a complete money transfer management platform that allows users to send, receive, track, and manage money transfers through agencies and agents. The system must support national and international transfers, multi-currency exchange, fees and commissions, compliance checks, reports, notifications, and client self-service.

---

## 2. Main Goals

The system must allow:

- Sending money nationally and internationally
- Paying out money to beneficiaries
- Managing agencies, agents, managers, clients, and admins
- Generating unique transfer references / withdrawal codes
- Tracking transfers in real time
- Managing currencies and exchange rates
- Calculating fees and commissions automatically
- Managing agent cash sessions and daily reconciliation
- Detecting suspicious operations and supporting KYC / AML logic
- Sending notifications by SMS / email / push simulation
- Providing reports and dashboards
- Supporting a chatbot for FAQs and transfer tracking
- Simulating mobile money providers such as Orange Money, Wave, and M-Pesa

---

## 3. Global Architecture

The project must be implemented as a **monolithic application** using layered architecture.

### Layers

1. **Presentation Layer**
   - Spring MVC REST controllers
   - DTO input/output
   - Request validation
   - API response formatting

2. **Service Layer**
   - Business logic
   - Transactions
   - Validation rules
   - Workflow orchestration

3. **Persistence Layer**
   - JPA entities
   - Repositories
   - Database queries

4. **Infrastructure Layer**
   - Security configuration
   - JWT configuration
   - Swagger configuration
   - CORS configuration
   - Exception handling
   - Audit logging

---

## 4. Technology Stack

### Backend

- Java
- Spring MVC 6
- Spring Security 6
- Spring Data JPA
- Hibernate
- JWT authentication
- REST API
- Jakarta Servlet API
- Jakarta Validation
- Maven

### Database

Use one of:

- PostgreSQL
- MySQL

### Frontend

- Angular 17+
- Angular Router
- Guards
- HTTP interceptors
- Chart.js
- i18n support

### API Documentation

- SpringDoc OpenAPI 3
- Swagger UI
- Manual configuration without Spring Boot

### Not Priority / Not Required Now

The following items exist in the CDC but are not priority because they were considered non-required or crossed out:

- Docker
- Docker Compose
- CI/CD GitHub Actions
- Spring Actuator
- Micrometer
- Advanced monitoring
- Full technical report

---

## 5. User Roles

The system uses Spring Security role-based access control.

### ROLE_ADMIN

Admin responsibilities:

- Manage users
- Manage agencies
- Manage currencies
- Manage exchange rates
- Manage fees and commissions
- View global reports
- View audit logs
- Supervise compliance alerts

### ROLE_MANAGER

Manager responsibilities:

- Manage agents of their agency
- Validate sensitive operations
- View agency reports
- Monitor daily limits
- Supervise cash sessions

### ROLE_AGENT

Agent responsibilities:

- Register money transfers
- Verify sender identity
- Verify beneficiary identity
- Pay out transfers
- Manage cash operations
- Open and close daily cash sessions
- Report cash differences

### ROLE_CLIENT

Client responsibilities:

- Register and log in
- View transfer history
- Track transfers
- Manage profile
- Manage notification preferences

---

## 6. Main Business Modules

Even though the application is monolithic, the logic should be organized by business modules/packages.

### 6.1 Auth & Users Module

Responsible for:

- User registration
- Login
- JWT generation
- Refresh token handling
- Password hashing using BCrypt
- Role management
- User activation/suspension
- 2FA SMS OTP simulation

Main entities:

- User
- Role
- RefreshToken
- OtpCode
- ClientProfile
- EmployeeProfile

---

### 6.2 Agency Module

Responsible for:

- Creating agencies
- Updating agencies
- Suspending agencies
- Activating agencies
- Assigning managers
- Assigning agents
- Defining agency limits
- Viewing agency performance

Main entities:

- Agency
- AgencyLimit
- AgencyAssignment

---

### 6.3 Transfer Module

Responsible for:

- Creating transfers
- Generating transfer reference
- Generating withdrawal code / OTP
- Managing sender and beneficiary information
- Calculating received amount
- Managing transfer status
- Canceling or expiring transfers

Important business rule:

If a sender sends 500 DH and the beneficiary is supposed to receive 500 DH, the beneficiary cannot withdraw only 300 DH and leave 200 DH. A transfer payout must be complete unless a specific partial-payout feature is explicitly designed, which is not required now.

Main statuses:

- PENDING
- PAID
- CANCELLED
- EXPIRED
- BLOCKED

Main entities:

- Transfer
- TransferSender
- TransferBeneficiary
- TransferStatusHistory
- WithdrawalCode

---

### 6.4 Payment & Cash Module

Responsible for:

- Agent cash sessions
- Opening cash session at beginning of day
- Closing cash session at end of day
- Recording cash in/out movements
- Linking transfers and payouts to cash sessions
- Calculating expected balance
- Calculating real closing balance
- Reporting missing or extra funds
- Reconciliation

Important idea:

Every financial operation done by an agent should be linked to an active `agent_cash_session`.

Main entities:

- AgentCashSession
- CashMovement
- CashReconciliation
- CashDifferenceReport

Cash movement types:

- TRANSFER_IN
- PAYOUT_OUT
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- SESSION_OPENING
- SESSION_CLOSING

Meaning of adjustments:

- `ADJUSTMENT_IN`: manual correction that adds money to the expected cash balance
- `ADJUSTMENT_OUT`: manual correction that removes money from the expected cash balance

Expected balance formula example:

```text
expected_balance = opening_balance + total_cash_in - total_cash_out + adjustment_in - adjustment_out
```

---

### 6.5 Currency & FX Module

Responsible for:

- Managing currencies
- Managing countries
- Managing transfer corridors
- Updating exchange rates
- Storing exchange rate history
- Converting amounts between currencies

Main entities:

- Currency
- Country
- TransferCorridor
- ExchangeRate
- ExchangeRateHistory

---

### 6.6 Fees & Commission Module

Responsible for:

- Defining fee grids
- Defining amount brackets
- Calculating customer fees
- Calculating agency commission
- Calculating central commission
- Simulating fees before transfer creation
- Exporting fees to PDF / CSV if required

Main entities:

- FeeGrid
- FeeBracket
- CommissionRule
- FeeSimulation

Fee bracket meaning:

A `fee_bracket` represents an amount interval used to calculate fees.

Example:

```text
0 - 500 DH       => fee = 10 DH
501 - 1000 DH    => fee = 20 DH
1001 - 5000 DH   => fee = 50 DH
```

---

### 6.7 Notification Module

Responsible for:

- Sending transfer confirmation notification
- Sending payout notification
- Sending OTP / withdrawal code simulation
- Sending status update notification
- Managing notification preferences

Channels:

- SMS simulation
- Email simulation
- Push simulation

Main entities:

- Notification
- NotificationTemplate
- NotificationPreference

---

### 6.8 Compliance Module

Responsible for:

- KYC verification
- Identity document tracking
- Blacklist checking using fictive OFAC list
- Suspicious transaction detection
- Threshold rules
- Compliance alerts
- Manual review workflow

Main entities:

- KycDocument
- ComplianceRule
- BlacklistEntry
- ComplianceAlert
- SuspiciousActivityReport

---

### 6.9 Reporting Module

Responsible for:

- Global financial reports
- Agency reports
- Daily transfer volume
- Monthly transfer volume
- Revenue reports
- Commission reports
- Cash difference reports
- Compliance reports

Main report types:

- Daily volume report
- Monthly volume report
- Agency performance report
- Commission report
- Cash reconciliation report
- Suspicious activity report

---

### 6.10 Chatbot Module

Responsible for:

- Answering FAQ questions
- Explaining fees
- Explaining transfer delays
- Tracking transfer status
- Escalating to human support
- Supporting multiple languages: French, English, Arabic

Main entities:

- ChatSession
- ChatMessage
- ChatbotIntent
- EscalationTicket

---

### 6.11 Mobile Money Module

Responsible for simulating mobile money providers.

Supported simulated providers:

- Orange Money
- Wave
- M-Pesa

Functions:

- Send to mobile wallet
- Receive from mobile wallet
- SMS confirmation simulation
- Provider reconciliation
- Dashboard tracking

Main entities:

- MobileMoneyProvider
- MobileMoneyTransaction
- MobileMoneyReconciliation

---

### 6.12 Audit Module

Responsible for:

- Tracking who did what
- Tracking when an action happened
- Tracking IP address if available
- Tracking sensitive operations
- Supporting security and compliance traceability

Main entities:

- AuditLog
- SecurityEvent

Audit examples:

- User login
- Failed login
- Transfer created
- Transfer paid
- Transfer cancelled
- Exchange rate updated
- Fee grid updated
- Agency suspended
- Compliance alert reviewed

---

## 7. Important Business Workflows

### 7.1 Send Money Workflow

1. Agent opens an active cash session.
2. Agent enters sender information.
3. Agent enters beneficiary information.
4. Agent enters amount, source currency, destination country, and destination currency.
5. System checks corridor availability.
6. System calculates exchange rate if needed.
7. System calculates fees.
8. System calculates amount to be received.
9. System runs compliance checks.
10. If valid, system creates transfer.
11. System generates transfer reference and withdrawal code.
12. System records cash movement.
13. System sends notification.
14. System prints or generates receipt.

---

### 7.2 Payout Workflow

1. Agent opens an active cash session.
2. Agent searches transfer by reference, withdrawal code, or beneficiary phone.
3. System verifies transfer status.
4. System verifies transfer is not expired, cancelled, blocked, or already paid.
5. Agent verifies beneficiary identity.
6. Agent confirms payout.
7. System updates transfer status to PAID.
8. System records cash movement as payout out.
9. System links payout to cash session.
10. System sends notification.
11. System generates payout receipt.

---

### 7.3 Cash Session Workflow

1. Agent starts day by opening a cash session.
2. Opening balance is recorded.
3. All transfers and payouts during the day are linked to this session.
4. System continuously calculates expected balance.
5. Agent enters real closing balance at end of day.
6. System compares real balance with expected balance.
7. If there is a difference, a cash difference report is created.
8. Manager can review and validate the session.

---

## 8. Security Requirements

Security is a major part of the project.

Required security features:

- JWT access token
- Refresh token
- Stateless authentication
- Spring Security filter chain before DispatcherServlet
- BCrypt password hashing with strength 12
- Role-based authorization
- CSRF disabled for stateless REST API
- CORS configured
- Rate limiting for sensitive endpoints
- OTP for 2FA simulation
- Audit logging
- Input validation using Jakarta Validation
- No secrets in GitHub
- Environment variables for sensitive config

Token rules:

```text
Access token duration: 1 hour
Refresh token duration: 7 days
```

Rate limit example:

```text
Maximum 5 login attempts per 10 minutes
```

---

## 9. Non-Functional Requirements

The application should be:

- Robust
- Maintainable
- Secure
- Testable
- Scalable at architecture level through stateless sessions
- Clear and well documented

Other requirements:

- API response time target: less than 500 ms for 95% of requests
- RGPD-like privacy principles
- Pseudonymization where relevant
- Right to deletion if needed
- Accessibility WCAG 2.1 level A
- Angular internationalization support

---

## 10. Deliverables

Required deliverables:

1. Private GitHub repository
2. README file
3. UML diagrams
   - Use case diagram
   - Class diagram
   - Sequence diagrams
4. Database schema
5. Swagger UI documentation
6. Angular frontend
7. Spring MVC backend
8. Live demo
9. Presentation / soutenance

Not required now:

- Full technical report
- Docker setup
- CI/CD pipeline
- Monitoring stack

---

## 11. Development Constraints

- Use monolithic architecture.
- Do not create microservices.
- Do not use Spring Boot.
- Use manual Spring MVC configuration.
- Use layered architecture.
- Use DTOs, not entities, in API responses.
- Use repositories only in service layer, not controllers.
- Use transactions in service layer.
- Use GitHub private repository.
- Do at least 3 commits per week.
- Never push passwords, tokens, or secrets.
- Use fictive data only.

---

## 12. Recommended Package Structure

```text
com.okane.transfer
│
├── config
│   ├── WebConfig.java
│   ├── SecurityConfig.java
│   ├── JpaConfig.java
│   ├── SwaggerConfig.java
│   └── CorsConfig.java
│
│
├── auth
│   ├── controller
│   ├── service
│   ├── repository
│   ├── entity
│   ├── dto
│   └── security
│
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

---

## 13. Priority Order

Recommended development order:

1. Auth & Users
2. Agency management
3. Agent cash sessions
4. Currency & FX
5. Fees & commissions
6. Transfer creation
7. Payout workflow
8. Notifications
9. Compliance checks
10. Reporting
11. Chatbot
12. Mobile money simulation
13. Audit improvements
14. Frontend polishing
15. Swagger and demo preparation

---

## 14. Final Reminder

This project must look professional and complete, but the team has limited time. Focus first on a working core:

- Authentication
- Roles
- Agencies
- Agents
- Cash sessions
- Send transfer
- Payout transfer
- Fees
- Currency
- Basic reports
- Audit

Then add advanced features progressively.
