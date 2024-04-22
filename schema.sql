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