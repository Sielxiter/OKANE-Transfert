package com.okane.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import java.util.Properties;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.dao.annotation.PersistenceExceptionTranslationPostProcessor;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.stereotype.Controller;

@Configuration
@EnableTransactionManagement
@org.springframework.data.jpa.repository.config.EnableJpaRepositories(basePackages = "com.okane")
@ComponentScan(
        basePackages = "com.okane",
        excludeFilters = {
                @Filter(type = FilterType.ANNOTATION, classes = Controller.class),
                @Filter(type = FilterType.ANNOTATION, classes = RestController.class),
                @Filter(type = FilterType.ANNOTATION, classes = ControllerAdvice.class),
                @Filter(type = FilterType.ANNOTATION, classes = Configuration.class)
        }
)
public class JpaConfig {

    @Value("${db.driver-class-name}")
    private String driverClassName;

    @Value("${db.url}")
    private String jdbcUrl;

    @Value("${db.username}")
    private String username;

    @Value("${db.password}")
    private String password;

    @Value("${db.hikari.pool-name:OkaneTransferPool}")
    private String poolName;

    @Value("${db.hikari.maximum-pool-size:10}")
    private int maximumPoolSize;

    @Value("${db.hikari.minimum-idle:2}")
    private int minimumIdle;

    @Value("${db.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${jpa.dialect}")
    private String dialect;

    @Value("${jpa.show-sql:true}")
    private boolean showSql;

    @Value("${jpa.format-sql:true}")
    private boolean formatSql;

    @Value("${jpa.hbm2ddl.auto:update}")
    private String hbm2ddlAuto;

    @Value("${jpa.packages-to-scan:com.okane}")
    private String packagesToScan;

    @Bean(destroyMethod = "close")
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setPoolName(poolName);
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        config.setConnectionTimeout(connectionTimeout);
        return new HikariDataSource(config);
    }

    @Bean
    public HibernateJpaVendorAdapter jpaVendorAdapter() {
        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        adapter.setDatabasePlatform(dialect);
        adapter.setShowSql(showSql);
        adapter.setGenerateDdl(true);
        return adapter;
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
        LocalContainerEntityManagerFactoryBean factory = new LocalContainerEntityManagerFactoryBean();
        factory.setDataSource(dataSource);
        factory.setPackagesToScan(packagesToScan);
        factory.setJpaVendorAdapter(jpaVendorAdapter());
        factory.setJpaProperties(jpaProperties());
        return factory;
    }

    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean
    public PersistenceExceptionTranslationPostProcessor exceptionTranslationPostProcessor() {
        return new PersistenceExceptionTranslationPostProcessor();
    }

    private Properties jpaProperties() {
        Properties properties = new Properties();
        properties.put("hibernate.dialect", dialect);
        properties.put("hibernate.hbm2ddl.auto", hbm2ddlAuto);
        properties.put("hibernate.show_sql", Boolean.toString(showSql));
        properties.put("hibernate.format_sql", Boolean.toString(formatSql));
        properties.put("hibernate.jdbc.time_zone", "UTC");
        return properties;
    }
}