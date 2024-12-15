--
-- PostgreSQL database dump
--

-- Dumped from database version 17.1 (Debian 17.1-1.pgdg120+1)
-- Dumped by pg_dump version 17.1 (Debian 17.1-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: FavoriteList; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FavoriteList" (
    listid integer NOT NULL,
    userid integer,
    movieid integer NOT NULL,
    createdat timestamp without time zone NOT NULL,
    title character varying NOT NULL
);


ALTER TABLE public."FavoriteList" OWNER TO postgres;

--
-- Name: FavoriteList_listid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FavoriteList_listid_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FavoriteList_listid_seq" OWNER TO postgres;

--
-- Name: FavoriteList_listid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FavoriteList_listid_seq" OWNED BY public."FavoriteList".listid;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Group" (
    groupid integer NOT NULL,
    name character varying NOT NULL,
    ownerid integer,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    movieid integer
);


ALTER TABLE public."Group" OWNER TO postgres;

--
-- Name: GroupMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GroupMember" (
    groupid integer NOT NULL,
    userid integer NOT NULL,
    joinedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    isowner boolean DEFAULT false
);


ALTER TABLE public."GroupMember" OWNER TO postgres;

--
-- Name: GroupMovie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GroupMovie" (
    groupid integer NOT NULL,
    movieid integer NOT NULL,
    watchdate timestamp without time zone
);


ALTER TABLE public."GroupMovie" OWNER TO postgres;

--
-- Name: Group_groupid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Group_groupid_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Group_groupid_seq" OWNER TO postgres;

--
-- Name: Group_groupid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Group_groupid_seq" OWNED BY public."Group".groupid;


--
-- Name: Movie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Movie" (
    movieid integer NOT NULL,
    tmdbid integer,
    name character varying NOT NULL,
    createdat timestamp without time zone NOT NULL,
    updatedat timestamp without time zone NOT NULL,
    watchdate timestamp without time zone
);


ALTER TABLE public."Movie" OWNER TO postgres;

--
-- Name: Movie_movieid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Movie_movieid_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Movie_movieid_seq" OWNER TO postgres;

--
-- Name: Movie_movieid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Movie_movieid_seq" OWNED BY public."Movie".movieid;


--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    reviewid integer NOT NULL,
    userid integer NOT NULL,
    movied integer,
    rating integer NOT NULL,
    text text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Review_rating_check" CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: Review_reviewid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Review_reviewid_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Review_reviewid_seq" OWNER TO postgres;

--
-- Name: Review_reviewid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Review_reviewid_seq" OWNED BY public."Review".reviewid;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    userid integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    createdat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedat timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_userid_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_userid_seq" OWNER TO postgres;

--
-- Name: User_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_userid_seq" OWNED BY public."User".userid;


--
-- Name: FavoriteList listid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteList" ALTER COLUMN listid SET DEFAULT nextval('public."FavoriteList_listid_seq"'::regclass);


--
-- Name: Group groupid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group" ALTER COLUMN groupid SET DEFAULT nextval('public."Group_groupid_seq"'::regclass);


--
-- Name: Movie movieid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Movie" ALTER COLUMN movieid SET DEFAULT nextval('public."Movie_movieid_seq"'::regclass);


--
-- Name: Review reviewid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review" ALTER COLUMN reviewid SET DEFAULT nextval('public."Review_reviewid_seq"'::regclass);


--
-- Name: User userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN userid SET DEFAULT nextval('public."User_userid_seq"'::regclass);


--
-- Name: FavoriteList FavoriteList_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteList"
    ADD CONSTRAINT "FavoriteList_pkey" PRIMARY KEY (listid);

--
-- Name: GroupMember GroupMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_pkey" PRIMARY KEY (groupid, userid);


--
-- Name: GroupMovie GroupMovie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMovie"
    ADD CONSTRAINT "GroupMovie_pkey" PRIMARY KEY (groupid, movieid);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (groupid);


--
-- Name: Movie Movie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Movie"
    ADD CONSTRAINT "Movie_pkey" PRIMARY KEY (movieid);


--
-- Name: Movie Movie_tmdbid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Movie"
    ADD CONSTRAINT "Movie_tmdbid_key" UNIQUE (tmdbid);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (reviewid);


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (userid);


--
-- Name: FavoriteList FavoriteList_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteList"
    ADD CONSTRAINT "FavoriteList_userid_fkey" FOREIGN KEY (userid) REFERENCES public."User"(userid);

--
-- Name: GroupMember GroupMember_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_groupid_fkey" FOREIGN KEY (groupid) REFERENCES public."Group"(groupid) ON DELETE CASCADE;


--
-- Name: GroupMember GroupMember_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_userid_fkey" FOREIGN KEY (userid) REFERENCES public."User"(userid) ON DELETE CASCADE;


--
-- Name: GroupMovie GroupMovie_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMovie"
    ADD CONSTRAINT "GroupMovie_groupid_fkey" FOREIGN KEY (groupid) REFERENCES public."Group"(groupid) ON DELETE CASCADE;


--
-- Name: GroupMovie GroupMovie_movieid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GroupMovie"
    ADD CONSTRAINT "GroupMovie_movieid_fkey" FOREIGN KEY (movieid) REFERENCES public."Movie"(movieid) ON DELETE CASCADE;


--
-- Name: Group Group_movieid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_movieid_fkey" FOREIGN KEY (movieid) REFERENCES public."Movie"(movieid) ON DELETE SET NULL;


--
-- Name: Group Group_ownerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_ownerid_fkey" FOREIGN KEY (ownerid) REFERENCES public."User"(userid) ON DELETE SET NULL;


--
-- Name: Review Review_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userid_fkey" FOREIGN KEY (userid) REFERENCES public."User"(userid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

