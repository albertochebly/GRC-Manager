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
-- Name: frameworks; Type: TABLE; Schema: public; Owner: username
--

CREATE TABLE public.frameworks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    version character varying(50),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.frameworks OWNER TO username;

--
-- Data for Name: frameworks; Type: TABLE DATA; Schema: public; Owner: username
--

COPY public.frameworks (id, name, version, description, is_active, created_at) FROM stdin;
674ed5c1-f872-4f98-b9ff-eaf688ad147c	ISO27001	2022		t	2025-08-22 11:05:33.424513
\.


--
-- Name: frameworks frameworks_pkey; Type: CONSTRAINT; Schema: public; Owner: username
--

ALTER TABLE ONLY public.frameworks
    ADD CONSTRAINT frameworks_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

