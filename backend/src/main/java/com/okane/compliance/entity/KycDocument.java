package com.okane.compliance.entity;

import com.okane.customer.entity.Customer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_kyc")
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Customer customer;

    @Column(name = "type_piece", nullable = false, length = 30)
    private String documentType;

    @Column(name = "chemin_recto", length = 500)
    private String rectoPath;

    @Column(name = "chemin_verso", length = 500)
    private String versoPath;

    @Column(name = "chemin_passeport", length = 500)
    private String passportPath;

    @Lob
    @Column(name = "texte_ocr_brut")
    private String rawOcrText;

    @Lob
    @Column(name = "contenu_document")
    private byte[] documentContent;

    @Column(name = "nom_fichier_original", length = 255)
    private String originalFileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "nom_extrait", length = 150)
    private String extractedNom;

    @Column(name = "prenom_extrait", length = 150)
    private String extractedPrenom;

    @Column(name = "numero_piece_extrait", length = 100)
    private String extractedNumeroPiece;

    @Column(name = "nationalite_extraite", length = 100)
    private String extractedNationalite;

    @Column(name = "confiance_extraction")
    private Double extractionConfidence;

    @Column(name = "cree_le")
    private LocalDateTime createdAt;

    public KycDocument() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getRectoPath() { return rectoPath; }
    public void setRectoPath(String rectoPath) { this.rectoPath = rectoPath; }

    public String getVersoPath() { return versoPath; }
    public void setVersoPath(String versoPath) { this.versoPath = versoPath; }

    public String getPassportPath() { return passportPath; }
    public void setPassportPath(String passportPath) { this.passportPath = passportPath; }

    public String getRawOcrText() { return rawOcrText; }
    public void setRawOcrText(String rawOcrText) { this.rawOcrText = rawOcrText; }

    public byte[] getDocumentContent() { return documentContent; }
    public void setDocumentContent(byte[] documentContent) { this.documentContent = documentContent; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getExtractedNom() { return extractedNom; }
    public void setExtractedNom(String extractedNom) { this.extractedNom = extractedNom; }

    public String getExtractedPrenom() { return extractedPrenom; }
    public void setExtractedPrenom(String extractedPrenom) { this.extractedPrenom = extractedPrenom; }

    public String getExtractedNumeroPiece() { return extractedNumeroPiece; }
    public void setExtractedNumeroPiece(String extractedNumeroPiece) { this.extractedNumeroPiece = extractedNumeroPiece; }

    public String getExtractedNationalite() { return extractedNationalite; }
    public void setExtractedNationalite(String extractedNationalite) { this.extractedNationalite = extractedNationalite; }

    public Double getExtractionConfidence() { return extractionConfidence; }
    public void setExtractionConfidence(Double extractionConfidence) { this.extractionConfidence = extractionConfidence; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
