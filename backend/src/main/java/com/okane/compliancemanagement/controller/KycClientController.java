package com.okane.compliancemanagement.controller;

import com.okane.auth.entity.Role;
import com.okane.auth.entity.User;
import com.okane.auth.repository.RoleRepository;
import com.okane.auth.repository.UserRepository;
import com.okane.compliance.entity.ComplianceAlert;
import com.okane.compliance.entity.KycDocument;
import com.okane.customer.entity.Customer;
import com.okane.customer.repository.CustomerRepository;
import com.okane.compliancemanagement.repository.ComplianceAlertRepository;
import com.okane.compliancemanagement.repository.KycDocumentRepository;
import com.okane.compliancemanagement.service.AmlScreeningService;
import com.okane.compliancemanagement.service.OcrService;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints for the agent sender workflow:
 * - Search existing clients
 * - OCR document extraction
 * - AML screening
 * - Create new client (sender)
 *
 * Protected by ROLE_AGENT or higher (via SecurityConfig /api/agent/**).
 */
@RestController
@RequestMapping("/api/agent")
public class KycClientController {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final KycDocumentRepository kycDocumentRepository;
    private final ComplianceAlertRepository complianceAlertRepository;
    private final OcrService ocrService;
    private final AmlScreeningService amlScreeningService;

    public KycClientController(CustomerRepository customerRepository,
                                UserRepository userRepository,
                                RoleRepository roleRepository,
                                PasswordEncoder passwordEncoder,
                                KycDocumentRepository kycDocumentRepository,
                                ComplianceAlertRepository complianceAlertRepository,
                                OcrService ocrService,
                                AmlScreeningService amlScreeningService) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.kycDocumentRepository = kycDocumentRepository;
        this.complianceAlertRepository = complianceAlertRepository;
        this.ocrService = ocrService;
        this.amlScreeningService = amlScreeningService;
    }

    // ─── Client Search ──────────────────────────────────────────────────────────

    @GetMapping("/clients/search")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> searchClients(@RequestParam(required = false) String q) {
        List<Customer> customers;
        if (q == null || q.trim().length() < 2) {
            // Return first 7 clients when no meaningful query
            customers = customerRepository.findAll(PageRequest.of(0, 7)).getContent();
        } else {
            customers = customerRepository.searchByQuery(q.trim(), PageRequest.of(0, 7));
        }

        List<Map<String, Object>> results = customers.stream().map(c -> {
            Map<String, Object> row = new HashMap<>();
            row.put("id", c.getId());
            row.put("fullName", buildFullName(c));
            row.put("phone", c.getUser() != null ? c.getUser().getPhone() : null);
            row.put("identityType", c.getIdentityType());
            row.put("identityNumber", c.getIdentityNumber());
            row.put("country", c.getCountry());
            row.put("nationality", c.getNationality());
            row.put("kycStatus", c.getKycStatus() != null ? c.getKycStatus() : "NON_VERIFIE");
            row.put("amlRiskLevel", c.getAmlRiskLevel() != null ? c.getAmlRiskLevel() : "NON_VERIFIE");
            row.put("restricted", Boolean.TRUE.equals(c.getRestricted()));
            return row;
        }).toList();

        return ResponseEntity.ok(results);
    }

    // ─── OCR Extraction ─────────────────────────────────────────────────────────

    @PostMapping("/kyc/ocr")
    public ResponseEntity<Map<String, Object>> performOcr(@RequestBody Map<String, String> request) {
        String imageBase64 = request.get("image");
        String documentType = request.getOrDefault("documentType", "CIN");

        if (imageBase64 == null || imageBase64.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image requise."));
        }

        // Remove data URI prefix if present
        if (imageBase64.contains(",")) {
            imageBase64 = imageBase64.substring(imageBase64.indexOf(',') + 1);
        }

        Map<String, Object> result = ocrService.extractFromImage(imageBase64, documentType);
        return ResponseEntity.ok(result);
    }

    // ─── AML Screening ──────────────────────────────────────────────────────────

    @PostMapping("/compliance/aml-check")
    public ResponseEntity<Map<String, Object>> amlCheck(@RequestBody Map<String, String> request) {
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");
        String nationality = request.get("nationality");

        if (firstName == null || firstName.isBlank() || lastName == null || lastName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Nom et prénom sont obligatoires pour le screening AML."));
        }

        Map<String, Object> result = amlScreeningService.screenPerson(firstName, lastName, nationality);
        return ResponseEntity.ok(result);
    }

    // ─── Create Client (Sender) ─────────────────────────────────────────────────

    @PostMapping("/clients")
    @Transactional
    public ResponseEntity<?> createClient(@RequestBody Map<String, Object> request) {
        String firstName = getStr(request, "firstName");
        String lastName = getStr(request, "lastName");
        String phone = getStr(request, "phone");
        String identityType = getStr(request, "identityType");
        String identityNumber = getStr(request, "identityNumber");
        String nationality = getStr(request, "nationality");
        String kycStatus = getStr(request, "kycStatus");
        String amlRiskLevel = getStr(request, "amlRiskLevel");

        // Validation
        if (firstName.isBlank() || lastName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nom et prénom sont obligatoires."));
        }
        if (identityType.isBlank() || identityNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Type et numéro de pièce sont obligatoires."));
        }
        if (phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le téléphone est obligatoire."));
        }

        // Check if client already exists with same identity
        Optional<Customer> existing = customerRepository.findByIdentityTypeAndIdentityNumber(
                identityType, identityNumber);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "Un client avec ce numéro de pièce existe déjà.",
                    "clientId", existing.get().getId()));
        }

        // Create User account for the client
        LocalDateTime now = LocalDateTime.now();
        Role clientRole = roleRepository.findByName("ROLE_CLIENT")
                .orElseThrow(() -> new RuntimeException("ROLE_CLIENT not found"));

        User user = new User();
        user.setFirstName(firstName.trim());
        user.setLastName(lastName.trim());
        user.setEmail(generateEmail(firstName, lastName));
        user.setPhone(phone.trim());
        user.setPasswordHash(passwordEncoder.encode("Okane2026!"));
        user.setEnabled(true);
        user.setAccountLocked(false);
        user.setAccountSuspended(false);
        user.setFailedLoginAttempts(0);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        user.setRole(clientRole);
        User savedUser = userRepository.save(user);

        // Create Customer profile
        Customer customer = new Customer();
        customer.setUser(savedUser);
        customer.setIdentityType(identityType.trim().toUpperCase());
        customer.setIdentityNumber(identityNumber.trim().toUpperCase());
        customer.setCountry(nationality != null && !nationality.isBlank() ? nationality.trim() : "Maroc");
        customer.setNationality(nationality != null && !nationality.isBlank() ? nationality.trim() : null);
        customer.setKycStatus(kycStatus != null && !kycStatus.isBlank() ? kycStatus : "EN_ATTENTE");
        customer.setAmlRiskLevel(amlRiskLevel != null && !amlRiskLevel.isBlank() ? amlRiskLevel : "LOW");
        customer.setRestricted("HIGH".equals(amlRiskLevel));
        customer.setCreatedAt(now);
        customer.setUpdatedAt(now);
        Customer savedCustomer = customerRepository.save(customer);

        // If AML risk is MEDIUM or HIGH, create a compliance alert
        if ("MEDIUM".equals(amlRiskLevel) || "HIGH".equals(amlRiskLevel)) {
            ComplianceAlert alert = new ComplianceAlert();
            alert.setCustomer(savedCustomer);
            alert.setAlertType("AML");
            alert.setRiskLevel(amlRiskLevel);
            alert.setMessage("Screening AML lors de la création du client " + firstName + " " + lastName);
            alert.setSource("OpenSanctions");
            alert.setStatus("EN_ATTENTE");
            alert.setCreatedAt(now);
            complianceAlertRepository.save(alert);
        }

        // Save OCR document reference if provided
        String rawOcrText = getStr(request, "rawOcrText");
        String documentType = getStr(request, "documentType");
        if (!rawOcrText.isBlank()) {
            KycDocument doc = new KycDocument();
            doc.setCustomer(savedCustomer);
            doc.setDocumentType(documentType.isBlank() ? identityType : documentType);
            doc.setRawOcrText(rawOcrText);
            doc.setExtractedNom(lastName);
            doc.setExtractedPrenom(firstName);
            doc.setExtractedNumeroPiece(identityNumber);
            doc.setExtractedNationalite(nationality);
            doc.setCreatedAt(now);
            kycDocumentRepository.save(doc);
        }

        // Return the created client
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedCustomer.getId());
        response.put("fullName", firstName + " " + lastName);
        response.put("phone", phone);
        response.put("identityType", savedCustomer.getIdentityType());
        response.put("identityNumber", savedCustomer.getIdentityNumber());
        response.put("country", savedCustomer.getCountry());
        response.put("nationality", savedCustomer.getNationality());
        response.put("kycStatus", savedCustomer.getKycStatus());
        response.put("amlRiskLevel", savedCustomer.getAmlRiskLevel());
        response.put("restricted", savedCustomer.getRestricted());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ─── Update Existing Client KYC ────────────────────────────────────────────

    @PatchMapping("/clients/{id}/kyc")
    @Transactional
    public ResponseEntity<?> updateClientKyc(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Customer> optCustomer = customerRepository.findById(id);
        if (optCustomer.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Client introuvable."));
        }

        Customer customer = optCustomer.get();
        String kycStatus = getStr(request, "kycStatus");
        String amlRiskLevel = getStr(request, "amlRiskLevel");
        String identityType = getStr(request, "identityType");
        String identityNumber = getStr(request, "identityNumber");
        String nationality = getStr(request, "nationality");
        String rawOcrText = getStr(request, "rawOcrText");

        // Update identity info if provided
        if (!identityType.isBlank()) customer.setIdentityType(identityType.toUpperCase());
        if (!identityNumber.isBlank()) customer.setIdentityNumber(identityNumber.toUpperCase());
        if (!nationality.isBlank()) customer.setNationality(nationality);

        // Update KYC/AML status
        if (!kycStatus.isBlank()) customer.setKycStatus(kycStatus);
        if (!amlRiskLevel.isBlank()) {
            customer.setAmlRiskLevel(amlRiskLevel);
            customer.setRestricted("HIGH".equals(amlRiskLevel));
        }

        customer.setUpdatedAt(LocalDateTime.now());
        customerRepository.save(customer);

        // Save OCR document if provided
        if (!rawOcrText.isBlank()) {
            KycDocument doc = new KycDocument();
            doc.setCustomer(customer);
            doc.setDocumentType(!identityType.isBlank() ? identityType : customer.getIdentityType());
            doc.setRawOcrText(rawOcrText);
            doc.setExtractedNom(customer.getUser() != null ? customer.getUser().getLastName() : null);
            doc.setExtractedPrenom(customer.getUser() != null ? customer.getUser().getFirstName() : null);
            doc.setExtractedNumeroPiece(customer.getIdentityNumber());
            doc.setExtractedNationalite(customer.getNationality());
            doc.setCreatedAt(LocalDateTime.now());
            kycDocumentRepository.save(doc);
        }

        // Create compliance alert if AML risk is elevated
        if ("MEDIUM".equals(amlRiskLevel) || "HIGH".equals(amlRiskLevel)) {
            ComplianceAlert alert = new ComplianceAlert();
            alert.setCustomer(customer);
            alert.setAlertType("AML");
            alert.setRiskLevel(amlRiskLevel);
            alert.setMessage("Screening AML lors de la vérification KYC du client " + buildFullName(customer));
            alert.setSource("OpenSanctions");
            alert.setStatus("EN_ATTENTE");
            alert.setCreatedAt(LocalDateTime.now());
            complianceAlertRepository.save(alert);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", customer.getId());
        response.put("fullName", buildFullName(customer));
        response.put("phone", customer.getUser() != null ? customer.getUser().getPhone() : null);
        response.put("identityType", customer.getIdentityType());
        response.put("identityNumber", customer.getIdentityNumber());
        response.put("country", customer.getCountry());
        response.put("nationality", customer.getNationality());
        response.put("kycStatus", customer.getKycStatus());
        response.put("amlRiskLevel", customer.getAmlRiskLevel());
        response.put("restricted", Boolean.TRUE.equals(customer.getRestricted()));

        return ResponseEntity.ok(response);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private String buildFullName(Customer c) {
        if (c.getUser() == null) return "—";
        String first = c.getUser().getFirstName() != null ? c.getUser().getFirstName() : "";
        String last = c.getUser().getLastName() != null ? c.getUser().getLastName() : "";
        return (first + " " + last).trim();
    }

    private String generateEmail(String firstName, String lastName) {
        String base = (firstName.toLowerCase().replaceAll("[^a-z]", "") + "."
                + lastName.toLowerCase().replaceAll("[^a-z]", ""));
        // Add timestamp to ensure uniqueness
        return base + "." + System.currentTimeMillis() % 10000 + "@okane.client";
    }

    private String getStr(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : "";
    }
}
