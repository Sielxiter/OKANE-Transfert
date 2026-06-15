package com.okane.webhook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DialogflowWebhookRequest {
    private String session;
    private QueryResult queryResult;

    // getters/setters ...
    public String getSession() { return session; }
    public void setSession(String session) { this.session = session; }
    public QueryResult getQueryResult() { return queryResult; }
    public void setQueryResult(QueryResult queryResult) { this.queryResult = queryResult; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QueryResult {
        private String queryText;
        private String action;
        private Map<String, Object> parameters;
        private String intentName;
        private String languageCode;
        // getters/setters ...
        public String getQueryText() { return queryText; }
        public void setQueryText(String queryText) { this.queryText = queryText; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public Map<String, Object> getParameters() { return parameters; }
        public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
        public String getIntentName() { return intentName; }
        public void setIntentName(String intentName) { this.intentName = intentName; }
        public String getLanguageCode() { return languageCode; }
        public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    }
}