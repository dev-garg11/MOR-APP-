from pydantic import BaseModel, Field


class StudentLogin(BaseModel):
    login_id: str
    password: str


class StudentCredentialsUpdate(BaseModel):
    login_id: str | None = Field(default=None, min_length=3, max_length=50)
    password: str = Field(min_length=8)


class StudentTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_id: int
    login_id: str
