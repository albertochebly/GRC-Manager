-- Create maturity_assessments table
CREATE TABLE IF NOT EXISTS "maturity_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"category" varchar(100) NOT NULL,
	"section" varchar(100) NOT NULL,
	"standard_ref" varchar(50) NOT NULL,
	"question" text NOT NULL,
	"current_maturity_level" varchar(10) NOT NULL,
	"current_maturity_score" integer DEFAULT 0 NOT NULL,
	"current_comments" text,
	"target_maturity_level" varchar(10) NOT NULL,
	"target_maturity_score" integer DEFAULT 0 NOT NULL,
	"target_comments" text,
	"created_by" varchar NOT NULL,
	"updated_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "maturity_assessments_organization_id_standard_ref_unique" UNIQUE("organization_id","standard_ref")
);

-- Add foreign key constraints
ALTER TABLE "maturity_assessments" ADD CONSTRAINT "maturity_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "maturity_assessments" ADD CONSTRAINT "maturity_assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "maturity_assessments" ADD CONSTRAINT "maturity_assessments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
