-- Up Migration
UPDATE specialist SET booking_url = '#' WHERE booking_url LIKE 'https://example-clinic.%';
UPDATE specialist SET profile_url = '#' WHERE profile_url LIKE 'https://example-clinic.%';

-- Down Migration
SELECT 1;
