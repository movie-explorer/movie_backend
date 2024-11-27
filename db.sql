CREATE TABLE User (
    userID SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Movie (
    movieID SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    genre VARCHAR,
    releaseDate DATE,
    description TEXT,
    rating DOUBLE PRECISION
);

CREATE TABLE Review (
    reviewID SERIAL PRIMARY KEY,
    userID INT REFERENCES User(userID),
    movieID INT REFERENCES Movie(movieID),
    rating INT,
    text TEXT,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE FavoriteList (
    listID SERIAL PRIMARY KEY,
    userID INT REFERENCES User(userID),
    movieID INT REFERENCES Movie(movieID),
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Group (
    groupID SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    ownerID INT REFERENCES User(userID),
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE GroupMember (
    groupID INT REFERENCES Group(groupID),
    userID INT REFERENCES User(userID),
    joinedAt TIMESTAMP NOT NULL,
    PRIMARY KEY (groupID, userID)
);

CREATE TABLE Follower (
    followerID INT REFERENCES User(userID),
    followedID INT REFERENCES User(userID),
    followedAt TIMESTAMP NOT NULL,
    PRIMARY KEY (followerID, followedID)
);
