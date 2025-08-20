CREATE TABLE "control_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"control_id" uuid NOT NULL,
	"document_title" varchar(500) NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"document_description" text,
	"content_template" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "control_templates" ADD CONSTRAINT "control_templates_control_id_controls_id_fk" FOREIGN KEY ("control_id") REFERENCES "public"."controls"("id") ON DELETE cascade ON UPDATE no action;