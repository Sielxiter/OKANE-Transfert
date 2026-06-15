package com.okane.webhook.controller;

import com.okane.webhook.dto.DialogflowWebhookRequest;
import com.okane.webhook.dto.DialogflowWebhookResponse;
import com.okane.webhook.service.DialogflowFulfillmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/webhook")
public class DialogflowWebhookController {

    @Autowired
    private DialogflowFulfillmentService fulfillmentService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public DialogflowWebhookResponse handleWebhook(@RequestBody DialogflowWebhookRequest request) {
        return fulfillmentService.handleRequest(request);
    }
}