-- ============================================================
-- FIX STORE COORDINATES - MotoMarket / MBServices
-- Run này trên SQL Server để update tọa độ đúng cho 4 chi nhánh Bình Dương
-- ============================================================

-- Kiểm tra stores hiện tại trước
SELECT id, name, address, latitude, longitude FROM stores;

-- Update tọa độ cho từng store theo tên
-- (Dùng LIKE để tránh hardcode ID)

UPDATE stores
SET 
    address = N'Đại lộ Bình Dương, Phú Hòa, Thủ Dầu Một, Bình Dương',
    latitude = 10.9726,
    longitude = 106.6851
WHERE name = 'MBServices Thu Dau Mot';

UPDATE stores
SET 
    address = N'Đường Lê Lợi, Phường Hòa Phú, TP. Bình Dương',
    latitude = 11.0528,
    longitude = 106.6667
WHERE name = 'MBServices Thanh Pho Moi';

UPDATE stores
SET 
    address = N'Đường Phú Lợi, Phường Phú Lợi, Thủ Dầu Một, Bình Dương',
    latitude = 10.9820,
    longitude = 106.6660
WHERE name = 'MBServices Phu Loi';

UPDATE stores
SET 
    address = N'Quốc lộ 13, Mỹ Phước, Bến Cát, Bình Dương',
    latitude = 11.1000,
    longitude = 106.6100
WHERE name = 'MBServices Ben Cat';

-- Verify sau khi update
SELECT id, name, address, latitude, longitude FROM stores;
