package com.okane.webhook.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DialogflowWebhookResponse {
    private String fulfillmentText;

    public DialogflowWebhookResponse() {}
    public DialogflowWebhookResponse(String fulfillmentText) { this.fulfillmentText = fulfillmentText; }
    public String getFulfillmentText() { return fulfillmentText; }
    public void setFulfillmentText(String fulfillmentText) { this.fulfillmentText = fulfillmentText; }
}