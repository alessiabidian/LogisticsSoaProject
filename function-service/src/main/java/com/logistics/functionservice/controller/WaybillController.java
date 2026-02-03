package com.logistics.functionservice.controller;

import com.logistics.functionservice.dto.ShipmentInfo;
import com.logistics.functionservice.function.WaybillFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/waybills")
@CrossOrigin(origins = "*")
public class WaybillController {

    @Autowired
    private Function<ShipmentInfo, String> generateWaybill;

    // 1. Generate a Waybill on demand (POST)
    @PostMapping("/generate")
    public ResponseEntity<String> createWaybill(@RequestBody ShipmentInfo info) {
        String filename = generateWaybill.apply(info);
        return ResponseEntity.ok("Generated: " + filename);
    }

    // 2. List all generated files
    @GetMapping
    public List<String> listWaybills() {
        File folder = new File(WaybillFunction.STORAGE_DIR);
        File[] files = folder.listFiles((dir, name) -> name.endsWith(".pdf"));

        if (files == null) return List.of("No documents found");

        return Arrays.stream(files)
                .map(File::getName)
                .collect(Collectors.toList());
    }

    // 3. Download a specific PDF
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> downloadWaybill(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(WaybillFunction.STORAGE_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/generate-download")
    public ResponseEntity<Resource> generateAndDownload(@RequestBody ShipmentInfo info) {
        // 1. Generate the file
        String filename = generateWaybill.apply(info);

        // 2. Read it back immediately
        try {
            Path filePath = Paths.get(WaybillFunction.STORAGE_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"waybill-" + info.getTrackingId() + ".pdf\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}