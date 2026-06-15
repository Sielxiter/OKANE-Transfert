package com.okane.auditmanagement.dto;

public class ExportAuditResponseDTO {

    private String fileName;
    private String contentType;
    private String downloadUrl;
    private String base64Content;

    public ExportAuditResponseDTO() {
    }

    public ExportAuditResponseDTO(String fileName, String contentType) {
        this.fileName = fileName;
        this.contentType = contentType;
    }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getDownloadUrl() { return downloadUrl; }
    public void setDownloadUrl(String downloadUrl) { this.downloadUrl = downloadUrl; }

    public String getBase64Content() { return base64Content; }
    public void setBase64Content(String base64Content) { this.base64Content = base64Content; }
}
