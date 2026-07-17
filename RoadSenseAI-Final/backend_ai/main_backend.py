
from flask import Flask, render_template, request
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "RoadSense AI Backend Running"

@app.route("/detect", methods=["POST"])
def detect():
    return {"status":"Detection endpoint ready"}

if __name__ == "__main__":
    app.run(debug=True)
