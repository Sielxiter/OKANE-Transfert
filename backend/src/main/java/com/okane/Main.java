package com.okane;

import com.okane.config.AppPropertiesConfig;
import com.okane.config.CorsConfig;
import com.okane.config.JpaConfig;
import com.okane.config.SecurityConfig;
import com.okane.config.SwaggerConfig;
import com.okane.config.WebConfig;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;

public class Main {

    public static void main(String[] args) throws Exception {
        Properties properties = loadProperties();
        int port = Integer.parseInt(properties.getProperty("server.port", "8080"));

        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        tomcat.getConnector();

        Path webappPath = resolveWebappPath();
        Context context = tomcat.addContext("", webappPath.toAbsolutePath().toString());

        AnnotationConfigWebApplicationContext applicationContext = new AnnotationConfigWebApplicationContext();
        applicationContext.register(
                AppPropertiesConfig.class,
                JpaConfig.class,
                SecurityConfig.class,
                WebConfig.class,
                CorsConfig.class,
                SwaggerConfig.class
        );
        applicationContext.setServletContext(context.getServletContext());
        applicationContext.refresh();

        DispatcherServlet dispatcherServlet = new DispatcherServlet(applicationContext);
        Tomcat.addServlet(context, "dispatcherServlet", dispatcherServlet);
        context.addServletMappingDecoded("/", "dispatcherServlet");

        tomcat.start();
        System.out.println("Okane Transfer backend started on http://localhost:" + port);
        tomcat.getServer().await();
    }

    private static Properties loadProperties() throws IOException {
        Properties properties = new Properties();
        try (InputStream inputStream = Main.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (inputStream != null) {
                properties.load(inputStream);
                return properties;
            }
        }

        try (InputStream inputStream = new FileInputStream("src/main/resources/application.properties")) {
            properties.load(inputStream);
        }

        return properties;
    }

    private static Path resolveWebappPath() {
        Path directPath = Paths.get(System.getProperty("user.dir"), "src", "main", "webapp");
        if (Files.exists(directPath)) {
            return directPath;
        }

        Path backendPath = Paths.get(System.getProperty("user.dir"), "backend", "src", "main", "webapp");
        if (Files.exists(backendPath)) {
            return backendPath;
        }

        return directPath;
    }
}
