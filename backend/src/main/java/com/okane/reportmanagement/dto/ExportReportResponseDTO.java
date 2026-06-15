package com.okane.reportmanagement.dto;

public class ExportReportResponseDTO {

    private String fileName;
    private String contentType;
    private String downloadUrl;
    private String base64Content;

    public ExportReportResponseDTO() {
    }

    public ExportReportResponseDTO(String fileName, String contentType, String downloadUrl) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.downloadUrl = downloadUrl;
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
