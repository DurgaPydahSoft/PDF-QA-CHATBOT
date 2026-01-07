import uvicorn
import os

if __name__ == "__main__":
    # Use environment variables or defaults
    port = int(os.environ.get("PORT", 7860))
    
    # Run the application
    # using "app.main:app" allows for reload support and proper package resolution
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
