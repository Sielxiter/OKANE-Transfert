package com.okane.webhook.service;

import com.okane.auth.exception.ApiException;
import com.okane.currencyfx.entity.Country;
import com.okane.currencyfx.entity.Currency;
import com.okane.currencyfx.repository.CountryRepository;
import com.okane.currencyfx.repository.CurrencyRepository;
import com.okane.currencyfx.repository.ExchangeRateRepository;
import com.okane.feescommission.entity.FeeBracket;
import com.okane.feescommission.entity.FeeGrid;
import com.okane.feescommission.repository.FeeBracketRepository;
import com.okane.feescommission.repository.FeeGridRepository;
import com.okane.webhook.dto.DialogflowWebhookResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FeesCalculationService {

    private static final Logger log = LoggerFactory.getLogger(FeesCalculationService.class);
    private static final String DEFAULT_CURRENCY = "MAD";

    @Autowired private CountryRepository countryRepository;
    @Autowired private CurrencyRepository currencyRepository;
    @Autowired private FeeGridRepository feeGridRepository;
    @Autowired private FeeBracketRepository feeBracketRepository;
    @Autowired private ExchangeRateRepository exchangeRateRepository;

    public DialogflowWebhookResponse calculateFees(Map<String, Object> parameters, String languageCode) {
        log.info("=== calculateFees START | lang={} | params={}", languageCode, parameters);
        try {
            // 1. Extraire paramètres
            Map<String, Object> amountCurrency = (Map<String, Object>) parameters.get("amount_currency");
            if (amountCurrency == null) {
                log.warn("STEP 1 FAIL: amount_currency is null in params: {}", parameters);
                return errorResponse(languageCode, "missing_amount");
            }

            Object rawAmount = amountCurrency.get("amount");
            String sourceCurrencyCode = (String) amountCurrency.get("currency");
            String destinationCountryName = (String) parameters.get("country");

            log.info("STEP 1 OK | rawAmount={} ({}), currency={}, country={}",
                    rawAmount, rawAmount != null ? rawAmount.getClass().getSimpleName() : "null",
                    sourceCurrencyCode, destinationCountryName);

            if (rawAmount == null || sourceCurrencyCode == null || destinationCountryName == null) {
                log.warn("STEP 1 FAIL: missing param — amount={}, currency={}, country={}",
                        rawAmount, sourceCurrencyCode, destinationCountryName);
                return errorResponse(languageCode, "missing_params");
            }

            // Gestion robuste du type de amount (peut être Double ou Integer selon Dialogflow)
            BigDecimal amount;
            if (rawAmount instanceof Number) {
                amount = BigDecimal.valueOf(((Number) rawAmount).doubleValue());
            } else {
                amount = new BigDecimal(rawAmount.toString());
            }
            log.info("STEP 1 amount parsed: {}", amount);

            // 2. Devise source
            Currency sourceCurrency = currencyRepository.findByCode(sourceCurrencyCode)
                    .orElseThrow(() -> {
                        log.warn("STEP 2 FAIL: currency not found in DB: '{}'", sourceCurrencyCode);
                        return new ApiException(HttpStatus.BAD_REQUEST, "Devise inconnue: " + sourceCurrencyCode);
                    });
            log.info("STEP 2 OK | sourceCurrency id={} code={}", sourceCurrency.getId(), sourceCurrencyCode);

            // 3. Pays destination — essayer plusieurs variantes du nom
            Country destinationCountry = findCountryByName(destinationCountryName)
                    .orElseThrow(() -> {
                        log.warn("STEP 3 FAIL: destination country not found: '{}'", destinationCountryName);
                        return new ApiException(HttpStatus.BAD_REQUEST, "Pays de destination non supporté: " + destinationCountryName);
                    });
            log.info("STEP 3 OK | destinationCountry id={} name='{}'", destinationCountry.getId(), destinationCountry.getName());

            // 4. Grille tarifaire — recherche directe par devise envoyée + pays destination,
            //    sans imposer de pays source fixe. Si rien n'existe pour cette devise vers
            //    cette destination, on considère que l'envoi n'est pas possible.
            FeeGrid feeGrid = feeGridRepository
                    .findFirstByCorridor_DestinationCountry_IdAndCurrency_IdAndActiveTrue(
                            destinationCountry.getId(), sourceCurrency.getId())
                    .orElseThrow(() -> {
                        log.warn("STEP 4 FAIL: no active FeeGrid for currency id={} ({}) -> destination id={} ({})",
                                sourceCurrency.getId(), sourceCurrencyCode,
                                destinationCountry.getId(), destinationCountry.getName());
                        return new ApiException(HttpStatus.BAD_REQUEST, "no_grid_for_currency_destination");
                    });
            log.info("STEP 4 OK | feeGrid id={} name='{}'", feeGrid.getId(), feeGrid.getName());

            // 5. Tranche applicable
            FeeBracket bracket = findApplicableBracket(amount, feeGrid.getId());
            log.info("STEP 5 OK | bracket min={} max={} feeType={} feeValue={}",
                    bracket.getMinAmount(), bracket.getMaxAmount(), bracket.getFeeType(), bracket.getFeeValue());

            // 6. Calcul frais
            BigDecimal fee = calculateFee(amount, bracket);
            log.info("STEP 6 OK | fee={}", fee);

            // 7. Conversion MAD
            BigDecimal amountInMad = convertToMad(amount, sourceCurrencyCode).setScale(2, RoundingMode.HALF_UP);
            BigDecimal feeInMad = convertToMad(fee, sourceCurrencyCode).setScale(2, RoundingMode.HALF_UP);
            BigDecimal total = amountInMad.add(feeInMad);
            log.info("STEP 7 OK | amountInMad={} feeInMad={} total={}", amountInMad, feeInMad, total);

            String responseText = formatResponse(languageCode, amount, sourceCurrencyCode,
                    destinationCountry.getName(), feeInMad, total);
            log.info("=== calculateFees END OK | response: {}", responseText);
            return new DialogflowWebhookResponse(responseText);

        } catch (ApiException e) {
            log.warn("=== calculateFees BUSINESS ERROR: {}", e.getMessage());
            return errorResponse(languageCode, e.getMessage());
        } catch (Exception e) {
            log.error("=== calculateFees TECHNICAL ERROR: {} — {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return errorResponse(languageCode, "technical");
        }
    }

    private Optional<Country> findCountryByName(String name) {
        if (name == null) return Optional.empty();

        Optional<Country> result = countryRepository.findByNameIgnoreCase(name);
        if (result.isPresent()) return result;

        String normalized = java.text.Normalizer
                .normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        log.info("Country not found by '{}', trying normalized: '{}'", name, normalized);
        return countryRepository.findByNameIgnoreCase(normalized);
    }

    private FeeBracket findApplicableBracket(BigDecimal amount, Long feeGridId) {
        List<FeeBracket> brackets = feeBracketRepository.findByFeeGrid_IdOrderByMinAmountAsc(feeGridId);
        log.info("Available brackets for feeGrid {}: {}", feeGridId, brackets.size());
        return brackets.stream()
                .filter(b -> amount.compareTo(b.getMinAmount()) >= 0 && amount.compareTo(b.getMaxAmount()) <= 0)
                .findFirst()
                .orElseThrow(() -> {
                    log.warn("No bracket found for amount={} in feeGrid={}", amount, feeGridId);
                    return new ApiException(HttpStatus.BAD_REQUEST, "Aucune tranche pour ce montant");
                });
    }

    private BigDecimal calculateFee(BigDecimal amount, FeeBracket bracket) {
        String type = bracket.getFeeType();
        BigDecimal value = bracket.getFeeValue();
        if ("FIXE".equalsIgnoreCase(type)) {
            return value;
        } else if ("POURCENTAGE".equalsIgnoreCase(type)) {
            return amount.multiply(value.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP));
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Type de frais inconnu: " + type);
        }
    }

    private BigDecimal convertToMad(BigDecimal amount, String fromCurrencyCode) {
        if (amount == null || fromCurrencyCode == null) return BigDecimal.ZERO;
        if (DEFAULT_CURRENCY.equalsIgnoreCase(fromCurrencyCode)) return amount;
        Optional<Currency> fromCurr = currencyRepository.findByCode(fromCurrencyCode);
        Optional<Currency> toCurr = currencyRepository.findByCode(DEFAULT_CURRENCY);
        if (fromCurr.isEmpty() || toCurr.isEmpty()) return amount;
        var rateOpt = exchangeRateRepository.findTopByFromCurrency_IdAndToCurrency_IdOrderByEffectiveAtDesc(
                fromCurr.get().getId(), toCurr.get().getId());
        if (rateOpt.isPresent() && rateOpt.get().getRate() != null
                && rateOpt.get().getRate().compareTo(BigDecimal.ZERO) > 0) {
            return amount.multiply(rateOpt.get().getRate()).setScale(8, RoundingMode.HALF_UP);
        }
        return amount;
    }

    private String formatResponse(String lang, BigDecimal amount, String currencyCode,
                                  String destination, BigDecimal feeInMad, BigDecimal total) {
        if ("en".equalsIgnoreCase(lang)) {
            return String.format("To send %.2f %s to %s, the fees are %.2f MAD. Total to pay: %.2f MAD.",
                    amount, currencyCode, destination, feeInMad, total);
        } else if ("ar".equalsIgnoreCase(lang)) {
            return String.format("لإرسال %.2f %s إلى %s، الرسوم هي %.2f درهم. المجموع: %.2f درهم.",
                    amount, currencyCode, destination, feeInMad, total);
        } else {
            return String.format("Pour envoyer %.2f %s vers %s, les frais sont de %.2f MAD. Total à payer : %.2f MAD.",
                    amount, currencyCode, destination, feeInMad, total);
        }
    }

    private DialogflowWebhookResponse errorResponse(String lang, String errorKey) {
        String msg;
        if ("en".equalsIgnoreCase(lang)) {
            switch (errorKey) {
                case "missing_amount": msg = "Please specify an amount and currency (e.g., 1000 MAD)."; break;
                case "missing_params": msg = "I need the amount, currency and destination country."; break;
                case "no_grid_for_currency_destination": msg = "Sorry, it is not possible to send this currency to this destination."; break;
                default: msg = "Sorry, I couldn't calculate the fees. Please try again later.";
            }
        } else if ("ar".equalsIgnoreCase(lang)) {
            switch (errorKey) {
                case "missing_amount": msg = "يرجى تحديد المبلغ والعملة (مثال: 1000 درهم)."; break;
                case "missing_params": msg = "أحتاج إلى المبلغ والعملة وبلد الوجهة."; break;
                case "no_grid_for_currency_destination": msg = "عذراً، لا يمكن إرسال هذه العملة إلى هذه الوجهة."; break;
                default: msg = "عذراً، لم أتمكن من حساب الرسوم. يرجى المحاولة لاحقاً.";
            }
        } else {
            switch (errorKey) {
                case "missing_amount": msg = "Veuillez indiquer un montant et une devise (ex: 1000 MAD)."; break;
                case "missing_params": msg = "J'ai besoin du montant, de la devise et du pays de destination."; break;
                case "no_grid_for_currency_destination": msg = "Désolé, il n'est pas possible d'envoyer cette devise vers ce pays."; break;
                default: msg = "Désolé, je n'ai pas pu calculer les frais. Veuillez réessayer plus tard.";
            }
        }
        return new DialogflowWebhookResponse(msg);
    }
}