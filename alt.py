from flask import Flask, render_template, Response, jsonify
from typing import Tuple
import cv2
import time
import threading
import queue
import collections
import numpy as np
from statistics import mean, stdev
from scipy.ndimage import gaussian_filter
from flask_cors import CORS
from cam import Camera as AltCamera

app = Flask(__name__, static_url_path='', static_folder='static')
cors = CORS(app, resources={r"*": {"origins": "*"}})

# alt_cam_url = "rtsp://127.0.0.1:8554/unicast"
alt_cam_url = 0

alt_cam = AltCamera(alt_cam_url, app.logger)

@app.route("/local")
def render_local():
    return render_template('local.html')

@app.route("/period")
def get_period():
    return jsonify({
            "period": list(alt_cam.get_period())
        })

@app.route("/extreme_points")
def get_extreme_points():
    return jsonify({
            "points": list(alt_cam.get_extreme_points())
        })

@app.route('/video_feed/<string:id>/', methods=["GET"])
def video_feed(id):
    return Response(alt_cam.gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
