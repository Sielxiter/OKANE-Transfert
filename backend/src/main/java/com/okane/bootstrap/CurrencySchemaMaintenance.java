package com.okane.bootstrap;

import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CurrencySchemaMaintenance {

    public CurrencySchemaMaintenance(DataSource dataSource) {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        Integer exists = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'devises'
                  AND column_name = 'code'
                """,
                Integer.class
        );

        if (exists != null && exists > 0) {
            jdbcTemplate.execute("ALTER TABLE devises DROP COLUMN code");
        }

        Integer countryPhoneCodeExists = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'pays'
                  AND column_name = 'indicatif_telephone'
                """,
                Integer.class
        );

        if (countryPhoneCodeExists == null || countryPhoneCodeExists == 0) {
            jdbcTemplate.execute("ALTER TABLE pays ADD COLUMN indicatif_telephone VARCHAR(20) NULL AFTER nom");
        }
    }
}
