import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "72"))

    # MySQL via PyMySQL. Example:
    #   mysql+pymysql://sharebite:password@localhost:3306/sharebite
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/sharebite",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": 10,
        "max_overflow": 20,
        "connect_args": {"connect_timeout": 10},
    }

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")