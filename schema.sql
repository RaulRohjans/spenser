CREATE TABLE IF NOT EXISTS "user" (
    id INT GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(320) NOT NULL,
    avatar VARCHAR(50),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    password varchar(72) NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS category (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT NOT NULL,
    name varchar(50) NOT NULL,
    icon varchar(50),
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS transaction (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT NOT NULL,
    category INT NOT NULL,
    name varchar(150),
    value decimal NOT NULL,
    date TIMESTAMP NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id),
    CONSTRAINT fk_category
        FOREIGN KEY(category)
            REFERENCES category(id)
);

CREATE TABLE IF NOT EXISTS currency (
    id INT GENERATED ALWAYS AS IDENTITY,
    symbol varchar(5) NOT NULL,
    placement varchar(6) NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT NOT NULL UNIQUE,
    currency INT NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_currency
        FOREIGN KEY("currency")
            REFERENCES currency(id)
);

CREATE TABLE IF NOT EXISTS global_settings (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT NOT NULL,
    importer_provider VARCHAR(50) NOT NULL,
    gpt_model VARCHAR(100),
    gpt_token VARCHAR(150),
    ollama_model VARCHAR(100),
    ollama_url varchar(150),
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS budget (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT NOT NULL,
    category INT,
    name varchar(150),
    value decimal NOT NULL,
    period varchar(100) NOT NULL,
    "order" INT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id),
    CONSTRAINT fk_category
        FOREIGN KEY(category)
            REFERENCES category(id)
);