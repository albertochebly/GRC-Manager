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

--
-- Data for Name: frameworks; Type: TABLE DATA; Schema: public; Owner: username
--

COPY public.frameworks (id, name, version, description, is_active, created_at) FROM stdin;
674ed5c1-f872-4f98-b9ff-eaf688ad147c	ISO27001	2022		t	2025-08-22 11:05:33.424513
\.


--
-- PostgreSQL database dump complete
--

