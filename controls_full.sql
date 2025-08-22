--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: controls; Type: TABLE; Schema: public; Owner: username
--

CREATE TABLE public.controls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    framework_id uuid NOT NULL,
    control_id character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    category character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.controls OWNER TO username;

--
-- Data for Name: controls; Type: TABLE DATA; Schema: public; Owner: username
--

COPY public.controls (id, framework_id, control_id, title, description, category, created_at) FROM stdin;
86b24af7-5fa3-407d-a344-1ad988812a66	674ed5c1-f872-4f98-b9ff-eaf688ad147c	4.3	ISMS scope	Documented information required by ISO/IEC 27001 clause 4.3: ISMS scope	Documented Information	2025-08-22 11:56:42.355712
cd70bb2b-c9ad-4f41-9770-aa4a512e589a	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.1	Leadership and commitment	Documented information required by ISO/IEC 27001 clause 5.1: Leadership and commitment	Documented Information	2025-08-22 11:56:42.355712
b296e040-9806-4107-9aaf-f5cdd2800023	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.2	Information security policy	Documented information required by ISO/IEC 27001 clause 5.2: Information security policy	Documented Information	2025-08-22 11:56:42.355712
2d598f54-f804-4d36-9cfa-240a53bc45cb	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.3	Organizational roles, responsibilities, and authorities	Documented information required by ISO/IEC 27001 clause 5.3: Organizational roles, responsibilities, and authorities	Documented Information	2025-08-22 11:56:42.355712
9123c690-476f-48f0-9cfa-ce369f45d3ec	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.9	Inventory of information and other associated assets	Documented information required by ISO/IEC 27001 clause 5.9: Inventory of information and other associated assets	Documented Information	2025-08-22 11:56:42.355712
3879e160-f8bf-4f9a-ac89-fd5a6a2812a7	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.10	Acceptable use of information and other associated assets	Documented information required by ISO/IEC 27001 clause 5.10: Acceptable use of information and other associated assets	Documented Information	2025-08-22 11:56:42.355712
04bfd2aa-83e6-413a-b0a1-8ec7c8d65436	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.15	Access control	Documented information required by ISO/IEC 27001 clause 5.15: Access control	Documented Information	2025-08-22 11:56:42.355712
eb78d461-2a35-4105-822b-641d2437f9ae	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.19	Information security supplier relationships	Documented information required by ISO/IEC 27001 clause 5.19: Information security supplier relationships	Documented Information	2025-08-22 11:56:42.355712
310bcc7c-3603-4316-8fce-e2130ba6fa10	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.26	Response to information security incidents	Documented information required by ISO/IEC 27001 clause 5.26: Response to information security incidents	Documented Information	2025-08-22 11:56:42.355712
cd2ccc6d-d2fe-459d-94a4-c7b36ca6fa3f	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.29	Information security during disruption	Documented information required by ISO/IEC 27001 clause 5.29: Information security during disruption	Documented Information	2025-08-22 11:56:42.355712
f63531dc-a6ac-4277-879a-717afe0706ff	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.31	Legal, statutory, regulatory and contractual requirements	Documented information required by ISO/IEC 27001 clause 5.31: Legal, statutory, regulatory and contractual requirements	Documented Information	2025-08-22 11:56:42.355712
0d2bb968-28d6-4593-9ec6-e94a7bc597ec	674ed5c1-f872-4f98-b9ff-eaf688ad147c	5.37	Documented operating procedure	Documented information required by ISO/IEC 27001 clause 5.37: Documented operating procedure	Documented Information	2025-08-22 11:56:42.355712
cf18a019-5fae-4659-b1f2-8b527c065598	674ed5c1-f872-4f98-b9ff-eaf688ad147c	6.1	Actions to address risks and opportunities	Documented information required by ISO/IEC 27001 clause 6.1: Actions to address risks and opportunities	Documented Information	2025-08-22 11:56:42.355712
68b88416-7d12-4a4c-88f6-5b68e1720ce3	674ed5c1-f872-4f98-b9ff-eaf688ad147c	6.2	Information security objectives and plans	Documented information required by ISO/IEC 27001 clause 6.2: Information security objectives and plans	Documented Information	2025-08-22 11:56:42.355712
eb142dce-a895-45e3-8738-2e18b6564566	674ed5c1-f872-4f98-b9ff-eaf688ad147c	6.2	Terms and conditions of employment	Documented information required by ISO/IEC 27001 clause 6.2: Terms and conditions of employment	Documented Information	2025-08-22 11:56:42.355712
ab91ae9a-a13e-4b14-bdcc-9fb4be953dfc	674ed5c1-f872-4f98-b9ff-eaf688ad147c	6.6	Confidentiality or non-disclosure agreement	Documented information required by ISO/IEC 27001 clause 6.6: Confidentiality or non-disclosure agreement	Documented Information	2025-08-22 11:56:42.355712
00ed553f-3311-4974-968d-ef6e13d79242	674ed5c1-f872-4f98-b9ff-eaf688ad147c	7.2	Competence	Documented information required by ISO/IEC 27001 clause 7.2: Competence	Documented Information	2025-08-22 11:56:42.355712
0c74a899-737f-4b23-ae36-4b7513c63f66	674ed5c1-f872-4f98-b9ff-eaf688ad147c	7.4	Communication	Documented information required by ISO/IEC 27001 clause 7.4: Communication	Documented Information	2025-08-22 11:56:42.355712
bee74713-4645-4f14-9ba6-017099e39d44	674ed5c1-f872-4f98-b9ff-eaf688ad147c	7.5	Documented information	Documented information required by ISO/IEC 27001 clause 7.5: Documented information	Documented Information	2025-08-22 11:56:42.355712
9a9c8e94-1ca7-4bfc-a7d9-afe5d5987147	674ed5c1-f872-4f98-b9ff-eaf688ad147c	8.1	Operational planning and control	Documented information required by ISO/IEC 27001 clause 8.1: Operational planning and control	Documented Information	2025-08-22 11:56:42.355712
a772f272-2d2e-4d95-b59d-637b240f417c	674ed5c1-f872-4f98-b9ff-eaf688ad147c	8.2	Information risk assessment	Documented information required by ISO/IEC 27001 clause 8.2: Information risk assessment	Documented Information	2025-08-22 11:56:42.355712
4ae61b3a-592a-4016-b295-4ab0831f7a94	674ed5c1-f872-4f98-b9ff-eaf688ad147c	8.3	Information security risk treatment	Documented information required by ISO/IEC 27001 clause 8.3: Information security risk treatment	Documented Information	2025-08-22 11:56:42.355712
fe644538-705e-43fb-a1e2-0c9e18b85624	674ed5c1-f872-4f98-b9ff-eaf688ad147c	8.27	Secure system architecture and engineering principles	Documented information required by ISO/IEC 27001 clause 8.27: Secure system architecture and engineering principles	Documented Information	2025-08-22 11:56:42.355712
4fc1ee80-6e4b-498d-87ad-bef2de6f5e08	674ed5c1-f872-4f98-b9ff-eaf688ad147c	9.1	Monitoring, measurement, analysis and evaluation	Documented information required by ISO/IEC 27001 clause 9.1: Monitoring, measurement, analysis and evaluation	Documented Information	2025-08-22 11:56:42.355712
c6da8584-2e7f-4585-8a82-f918560d3e2a	674ed5c1-f872-4f98-b9ff-eaf688ad147c	9.2	Internal audit	Documented information required by ISO/IEC 27001 clause 9.2: Internal audit	Documented Information	2025-08-22 11:56:42.355712
8a5a647d-da73-44e1-81e9-90eac7721ad6	674ed5c1-f872-4f98-b9ff-eaf688ad147c	9.3	Management review	Documented information required by ISO/IEC 27001 clause 9.3: Management review	Documented Information	2025-08-22 11:56:42.355712
8f9c5228-1930-41a1-9e81-6c92f81c9fc6	674ed5c1-f872-4f98-b9ff-eaf688ad147c	10	Improvement	Documented information required by ISO/IEC 27001 clause 10: Improvement	Documented Information	2025-08-22 11:56:42.355712
7b7c4f7f-850c-46d5-9c9a-3dc0ccee0fca	674ed5c1-f872-4f98-b9ff-eaf688ad147c	10.2	Non-conformity and corrective action	Documented information required by ISO/IEC 27001 clause 10.2: Non-conformity and corrective action	Documented Information	2025-08-22 11:56:42.355712
634c929d-ef59-4f92-8581-6e1416784b53	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.5.12	Classification of information	Documented information required by ISO/IEC 27001 clause A.5.12: Classification of information	Documented Information	2025-08-22 11:56:42.355712
4ee13300-5179-4c38-a0fb-08b818713f4d	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.5.14	Information transfer	Documented information required by ISO/IEC 27001 clause A.5.14: Information transfer	Documented Information	2025-08-22 11:56:42.355712
6da06042-3f0f-4574-ae33-69d9e3dd4636	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.5.18	Access rights	Documented information required by ISO/IEC 27001 clause A.5.18: Access rights	Documented Information	2025-08-22 11:56:42.355712
b71821e2-caed-44a3-9a0f-ecd01be6955b	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.6.7	Remote working	Documented information required by ISO/IEC 27001 clause A.6.7: Remote working	Documented Information	2025-08-22 11:56:42.355712
fc4a63d4-adfa-4a7b-90aa-16ac13d1f951	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.7.6	Working in secure areas	Documented information required by ISO/IEC 27001 clause A.7.6: Working in secure areas	Documented Information	2025-08-22 11:56:42.355712
9f2c960b-e563-45de-90f4-7ac293c8eb1d	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.7.7	Clear desk and clear screen	Documented information required by ISO/IEC 27001 clause A.7.7: Clear desk and clear screen	Documented Information	2025-08-22 11:56:42.355712
8f2e0a7b-a25e-4874-8e08-fb6b5ff67a60	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.7.10	Storage media	Documented information required by ISO/IEC 27001 clause A.7.10: Storage media	Documented Information	2025-08-22 11:56:42.355712
488e2cb6-e98f-45a1-9286-72d108dec664	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.7.14	Secure disposal or re-use of equipment	Documented information required by ISO/IEC 27001 clause A.7.14: Secure disposal or re-use of equipment	Documented Information	2025-08-22 11:56:42.355712
298949f2-97c2-4427-be05-2de28158020c	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.8.13	Information backup	Documented information required by ISO/IEC 27001 clause A.8.13: Information backup	Documented Information	2025-08-22 11:56:42.355712
a97e72d5-4599-4851-b93c-bfb3e5d8c0e0	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.8.14	Redundancy of information processing facilities	Documented information required by ISO/IEC 27001 clause A.8.14: Redundancy of information processing facilities	Documented Information	2025-08-22 11:56:42.355712
33ef507d-6685-4834-8f27-5ba9dfa3af7e	674ed5c1-f872-4f98-b9ff-eaf688ad147c	A.8.32	Change management	Documented information required by ISO/IEC 27001 clause A.8.32: Change management	Documented Information	2025-08-22 11:56:42.355712
\.


--
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: public; Owner: username
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (id);


--
-- Name: controls controls_framework_id_frameworks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: username
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_framework_id_frameworks_id_fk FOREIGN KEY (framework_id) REFERENCES public.frameworks(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

