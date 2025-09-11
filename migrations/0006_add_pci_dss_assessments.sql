-- Create pci_dss_assessments table
CREATE TABLE IF NOT EXISTS "pci_dss_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requirement" varchar(10) NOT NULL,
	"sub_requirement" varchar(10),
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'not-applied' NOT NULL,
	"owner" varchar(100),
	"task" text,
	"completion_date" varchar(20),
	"comments" text,
	"created_by" varchar NOT NULL,
	"updated_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pci_dss_assessments_organization_id_requirement_unique" UNIQUE("organization_id","requirement")
);

-- Add foreign key constraints
ALTER TABLE "pci_dss_assessments" ADD CONSTRAINT "pci_dss_assessments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pci_dss_assessments" ADD CONSTRAINT "pci_dss_assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pci_dss_assessments" ADD CONSTRAINT "pci_dss_assessments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
