CREATE TABLE IF NOT EXISTS "user" (
    id INT GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(320) NOT NULL,
    avatar VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    password varchar(72) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS "user" (
    id INT GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(320) NOT NULL,
    avatar VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    password varchar(72) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS category (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT,
    name varchar(50),
    icon varchar(50),
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS transaction (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT,
    category INT,
    name varchar(150),
    value decimal,
    date TIMESTAMP NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id),
    CONSTRAINT fk_category
        FOREIGN KEY(category)
            REFERENCES category(id)
);