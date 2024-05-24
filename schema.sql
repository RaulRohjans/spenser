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
    "user" INT NOT NULL,
    name varchar(50) NOT NULL,
    icon varchar(50),
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
    symbol varchar(5),
    placement varchar(6) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT,
    currency INT,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id),
    CONSTRAINT fk_currency
        FOREIGN KEY("currency")
            REFERENCES currency(id)
);

CREATE TABLE IF NOT EXISTS global_settings (
    id INT GENERATED ALWAYS AS IDENTITY,
    "user" INT,
    currency INT,
    PRIMARY KEY(id),
    CONSTRAINT fk_user
        FOREIGN KEY("user")
            REFERENCES "user"(id),
    CONSTRAINT fk_currency
        FOREIGN KEY("currency")
            REFERENCES currency(id)
);