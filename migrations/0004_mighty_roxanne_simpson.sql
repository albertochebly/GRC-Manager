ALTER TABLE "risks" ADD COLUMN "confidentiality_impact" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "risks" ADD COLUMN "integrity_impact" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "risks" ADD COLUMN "availability_impact" integer NOT NULL;