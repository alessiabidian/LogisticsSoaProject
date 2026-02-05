package com.logistics.functionservice.function;

import com.logistics.functionservice.dto.ShipmentEvent;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.logistics.functionservice.dto.ShipmentInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;

@Configuration
@Slf4j
public class WaybillFunction {

    public static final String STORAGE_DIR = "generated-waybills";

    @Bean
    public Consumer<ShipmentEvent> generateWaybill() {
        return event -> {
            log.info("RabbitMQ Event Received for Tracking ID: {}", event.getTrackingId());
            createPdf(event);
        };
    }

    public String createPdf(ShipmentEvent event) {
        Document document = new Document();
        try {
            File directory = new File(STORAGE_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = "waybill_" + event.getTrackingId() + ".pdf";
            File file = new File(directory, fileName);

            PdfWriter.getInstance(document, new FileOutputStream(file));

            document.open();

            // --- PDF DESIGN ---
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new java.awt.Color(0, 51, 102));
            Paragraph title = new Paragraph("OFFICIAL WAYBILL", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Logistics App - Shipping System"));
            document.add(new Paragraph("Date: " + new Date().toString()));
            document.add(new Paragraph("\n--------------------------------------------------\n"));

            Font contentFont = FontFactory.getFont(FontFactory.COURIER, 14);
            document.add(new Paragraph("TRACKING ID:  " + event.getTrackingId(), FontFactory.getFont(FontFactory.COURIER_BOLD, 16)));

            String origin = event.getOrigin() != null ? event.getOrigin() : "N/A";
            String dest = event.getDestination() != null ? event.getDestination() : "N/A";

            document.add(new Paragraph("ORIGIN:       " + origin, contentFont));
            document.add(new Paragraph("DESTINATION:  " + dest, contentFont));
            document.add(new Paragraph("WEIGHT:       " + event.getWeight() + " kg", contentFont));
            document.add(new Paragraph("VEHICLE:      " + event.getLicensePlate(), contentFont));

            document.add(new Paragraph("\n--------------------------------------------------\n"));
            document.add(new Paragraph("||| || ||| || |||| ||| || " + event.getTrackingId()));

            document.close();
            log.info("Waybill Generated: {}", file.getAbsolutePath());

            return fileName;

        } catch (DocumentException | IOException e) {
            log.error("FaaS Error", e);
            return null;
        }
    }
}