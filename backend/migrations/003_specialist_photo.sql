-- Up Migration
ALTER TABLE specialist ADD COLUMN photo_url varchar(255);

-- Down Migration
ALTER TABLE specialist DROP COLUMN photo_url;
