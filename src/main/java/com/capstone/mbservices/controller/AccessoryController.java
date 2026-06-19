package com.capstone.mbservices.controller;

import com.capstone.mbservices.entity.Accessory;
import com.capstone.mbservices.service.AccessoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accessories")
@RequiredArgsConstructor
public class AccessoryController {
    private final AccessoryService accessoryService;

    @GetMapping
    public ResponseEntity<List<Accessory>> getAllActive() {
        return ResponseEntity.ok(accessoryService.getAllActiveAccessories());
    }

    @GetMapping("/search-paged")
    public ResponseEntity<Page<Accessory>> searchPaged(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        return ResponseEntity.ok(accessoryService.searchAccessories(keyword, pageRequest));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Accessory> getById(@PathVariable String id) {
        return ResponseEntity.ok(accessoryService.getAccessoryById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Accessory> create(@RequestBody Accessory accessory) {
        return ResponseEntity.ok(accessoryService.createAccessory(accessory));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Accessory> update(@PathVariable String id, @RequestBody Accessory accessory) {
        return ResponseEntity.ok(accessoryService.updateAccessory(id, accessory));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        accessoryService.deleteAccessory(id);
        return ResponseEntity.ok().build();
    }
}
