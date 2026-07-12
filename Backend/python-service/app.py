from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/recommend-books")
def recommend_books():
    return {
        "message": "Recommend books successfully",
        "data": {
            "newestBooks": [
                "Harry Potter",
                "Clean Code",
                "Design Patterns"
            ],
            "mostBorrowedBooks": [
                "Harry Potter"
            ]
        }
    }