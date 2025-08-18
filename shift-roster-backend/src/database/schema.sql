BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"action"	VARCHAR(100) NOT NULL,
	"details"	TEXT,
	"timestamp"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "area" (
	"area_id"	INTEGER NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"description"	TEXT,
	"color"	VARCHAR(7),
	"created_at"	DATETIME,
	PRIMARY KEY("area_id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "areas_of_responsibility" (
	"id"	INTEGER NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"description"	TEXT,
	"created_at"	DATETIME,
	"color"	TEXT DEFAULT '#3498db',
	PRIMARY KEY("id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "community_posts" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"post_type"	VARCHAR(50),
	"title"	VARCHAR(200) NOT NULL,
	"content"	TEXT NOT NULL,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "designations" (
	"designation_id"	INTEGER UNIQUE,
	"designation_name"	INTEGER,
	"created_on"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("designation_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "employee_licenses" (
	"id"	INTEGER NOT NULL,
	"employee_id"	INTEGER NOT NULL,
	"license_id"	INTEGER NOT NULL,
	"expiry_date"	DATE,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("employee_id") REFERENCES "users"("id"),
	FOREIGN KEY("license_id") REFERENCES "licenses"("id")
);
CREATE TABLE IF NOT EXISTS "employee_skills" (
	"employee_id"	INTEGER NOT NULL,
	"skill_id"	INTEGER NOT NULL,
	"proficiency_level"	VARCHAR(20),
	"created_at"	DATETIME,
	PRIMARY KEY("employee_id","skill_id"),
	FOREIGN KEY("employee_id") REFERENCES "users"("id"),
	FOREIGN KEY("skill_id") REFERENCES "skills"("id")
);
CREATE TABLE IF NOT EXISTS "leave_requests" (
	"id"	INTEGER NOT NULL,
	"employee_id"	INTEGER NOT NULL,
	"leave_type"	VARCHAR(20) NOT NULL,
	"start_date"	DATE NOT NULL,
	"end_date"	DATE NOT NULL,
	"days"	INTEGER NOT NULL,
	"reason"	TEXT,
	"status"	VARCHAR(20),
	"approved_by"	INTEGER,
	"approved_at"	DATETIME,
	"created_at"	DATETIME,
	"action_comment"	VARCHAR(200),
	PRIMARY KEY("id"),
	FOREIGN KEY("approved_by") REFERENCES "users"("id"),
	FOREIGN KEY("employee_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "leave_type" (
	"leave_type"	TEXT,
	"leave_type_id"	INTEGER,
	"date_update"	TEXT DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("leave_type_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "licenses" (
	"id"	INTEGER NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"description"	TEXT,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "post_replies" (
	"id"	INTEGER NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"post_id"	INTEGER NOT NULL,
	"content"	TEXT NOT NULL,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("post_id") REFERENCES "community_posts"("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "roles" (
	"id"	INTEGER NOT NULL,
	"name"	VARCHAR(50) NOT NULL,
	"permissions"	TEXT,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "shift_roster" (
	"id"	INTEGER NOT NULL,
	"employee_id"	INTEGER NOT NULL,
	"shift_id"	INTEGER NOT NULL,
	"date"	DATE NOT NULL,
	"hours"	FLOAT NOT NULL,
	"status"	VARCHAR(20),
	"approved_by"	INTEGER,
	"approved_at"	DATETIME,
	"notes"	TEXT,
	"created_at"	DATETIME,
	"accepted_at"	DATETIME,
	"area_of_responsibility_id"	INTEGER,
	PRIMARY KEY("id"),
	FOREIGN KEY("approved_by") REFERENCES "users"("id"),
	FOREIGN KEY("employee_id") REFERENCES "users"("id"),
	FOREIGN KEY("shift_id") REFERENCES "shifts"("id")
);
CREATE TABLE IF NOT EXISTS "shifts" (
	"id"	INTEGER NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"start_time"	TIME NOT NULL,
	"end_time"	TIME NOT NULL,
	"hours"	FLOAT NOT NULL,
	"description"	TEXT,
	"color"	VARCHAR(7),
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "skills" (
	"id"	INTEGER NOT NULL,
	"name"	VARCHAR(100) NOT NULL,
	"description"	TEXT,
	"created_at"	DATETIME,
	PRIMARY KEY("id"),
	UNIQUE("name")
);
CREATE TABLE IF NOT EXISTS "timesheets" (
	"id"	INTEGER NOT NULL,
	"employee_id"	INTEGER NOT NULL,
	"roster_id"	INTEGER NOT NULL,
	"date"	DATE NOT NULL,
	"hours_worked"	FLOAT NOT NULL,
	"status"	VARCHAR(20),
	"approved_by"	INTEGER,
	"approved_at"	DATETIME,
	"notes"	TEXT,
	"created_at"	DATETIME,
	"accepted_at"	DATETIME,
	PRIMARY KEY("id"),
	FOREIGN KEY("approved_by") REFERENCES "users"("id"),
	FOREIGN KEY("employee_id") REFERENCES "users"("id"),
	FOREIGN KEY("roster_id") REFERENCES "shift_roster"("id")
);
CREATE TABLE IF NOT EXISTS "user" (
	"user_id"	INTEGER UNIQUE,
	"user_name"	TEXT NOT NULL UNIQUE,
	"password"	TEXT,
	"email"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("user_id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER NOT NULL,
	"google_id"	VARCHAR(100),
	"email"	VARCHAR(120) NOT NULL UNIQUE,
	"name"	VARCHAR(100) NOT NULL,
	"surname"	VARCHAR(100) NOT NULL,
	"employee_id"	VARCHAR(20),
	"contact_no"	VARCHAR(20) NOT NULL,
	"area_of_responsibility_id"	NUMERIC,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME NOT NULL,
	"alt_contact_name"	VARCHAR(20),
	"alt_contact_no"	VARCHAR(20),
	"designation_id"	INTEGER,
	"role_id"	INTEGER NOT NULL,
	"rate_type"	STRING,
	"rate_-value"	NUMERIC,
	PRIMARY KEY("id" AUTOINCREMENT),
	CONSTRAINT "fk_designation_id" FOREIGN KEY("designation_id") REFERENCES "designations"("designation_id"),
	CONSTRAINT "fk_role_id" FOREIGN KEY("role_id") REFERENCES "roles"("id")
);
COMMIT;
